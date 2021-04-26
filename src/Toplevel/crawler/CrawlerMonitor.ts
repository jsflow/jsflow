import { ChromiumMonitor } from "../chromium/ChromiumMonitor";
import { CrawlerData } from "./CrawlerData";

//@ts-ignore
export class CrawlerMonitor extends ChromiumMonitor {

    CrawlerData: CrawlerData;

    constructor(global, print, log, info, warn, error) {
        super(global, print, log, info, warn, error);

        this.options.set('monitor.crawler', true);
        this.options.set('monitor.progress', true);

        this.CrawlerData = new CrawlerData();

        this.info("--------------------------------------------------------------------------------");
        this.info(`CrawlerMonitor (${new Date().toISOString()})`);
        this.options.report();
        this.info("--------------------------------------------------------------------------------");
    }


    executeAndUnlabelResult(code: string, url: string | null | undefined, preventTranspile : boolean): any {

        // disable label gathering for runtime
        if (preventTranspile) {
            this.options.set('monitor.crawler', false);
        }

        let result = super.executeAndUnlabelResult(code, url, preventTranspile);

        this.options.set('monitor.crawler', true);
        return result;
    }
}