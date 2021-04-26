import { CrawlerMonitor } from "./CrawlerMonitor";
import { Label } from "../../Label";

declare var monitor: CrawlerMonitor;
declare var window: { dumpToCrawler (data : any) : void };

export class CrawlerData {

    created: {
        [key: string]: {
            sizecount: Array<number>,
            // Set uses === to check for equality, which mean we cannot create a set of object (sets) without
            // the risk of duplicates, this is why we represent a label as a |-separated string.
            // Each string represents one label
            labels: Set<string> 
        } | undefined
    };

    escaping: {
        [key: string]: Set<string> | undefined
    };

    constructor() {
        this.created = {};
        this.escaping = {};
    }

    AddGenerated(label: Label): void {
        let url = monitor.url;
        let principals = label.ToArray();

        if (this.created[url] === undefined) {
            this.created[url] = { sizecount: [], labels: new Set() };
        }

        if (this.created[url].sizecount[principals.length] === undefined) {
            this.created[url].sizecount[principals.length] = 0;
        }

        this.created[url].sizecount[principals.length]++;
        this.created[url].labels.add(principals.join("|"));
    }

    AddEscaping(accessPath : string, label : Label) : void {
        if (this.escaping[accessPath] === undefined) {
            this.escaping[accessPath] = new Set();
        }  

        label.ToArray().forEach(value => this.escaping[accessPath].add(value));
    }

    // We cannot send Sets to the crawler; presumably only things that can be made int JSON can be
    DumpToCrawler() : void {
        let data : {
            created : {
                [key: string]: {
                    sizecount: Array<number>,
                    labels: Array<Array<string>>
                } | undefined
            },
            escaping : {
                [key: string]: Array<string> | undefined
            }
        } = { created : {}, escaping : {} };

        for (let url in this.created) { 
            let labels : Array<Array<string>> = [];
            for (let label of this.created[url].labels) {
                labels.push(label.split("|"));
            }

            data.created[url] = { 
                sizecount : this.created[url].sizecount,
                labels : labels
            }
        }

        for (let path in this.escaping) {
            let principals = Array.from(this.escaping[path]);
            if (principals.length == 0) {
                continue;
            }
            data.escaping[path] = principals;
        }

        window.dumpToCrawler(data);
    }

}
