
"use strict";
import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
    public apiSettings: ApiSettings = new ApiSettings();
}

export class ApiSettings {
    public openAiKey: string = "";
    public assistantId: string = "";
    public threadId: string = "";
}
