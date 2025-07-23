"use strict";
import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
    public apiSettings: ApiSettings = new ApiSettings();
}

export class ApiSettings {
    public nome: string = "gpt-4o";
    public openAiKey: string = "";
    public systemPrompt: string = "Você é um assistente útil no Power BI.";
    
}