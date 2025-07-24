
"use strict";
import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
    public apiSettings: ApiSettings = new ApiSettings();
}

export class ApiSettings {
    public openAiKey: string = "";
    public assistantId: string = "";
    public debug: string = "true";
    public modelo: string = "gpt-4o";
    public fontSize: number = 14;
}
