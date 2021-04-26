import { MonitorBase } from "../../MonitorBase";
import { CrawlerMonitor } from "./CrawlerMonitor";

export function IsCrawler(monitor : MonitorBase) : monitor is CrawlerMonitor {
    //@ts-ignore monitor.crawler is a boolean option
    return monitor.options.get("monitor.crawler");
}