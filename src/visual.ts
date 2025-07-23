
"use strict";

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;

import { VisualSettings } from "./settings";

export class Visual implements IVisual {
    private container: HTMLElement;
    private output: HTMLElement;
    private settings: VisualSettings;
    private apiKey: string = "";
    private systemPrompt: string = "";
    private nome: string = "gpt-4o";

    constructor(options: VisualConstructorOptions) {
        this.container = document.createElement("div");
        this.container.style.padding = "8px";
        this.container.style.fontFamily = "Segoe UI, sans-serif";
        this.container.style.fontSize = "13px";

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Faça sua pergunta...";
        input.style.width = "300px";
        input.style.marginRight = "10px";
        input.style.padding = "4px";
        input.style.border = "1px solid #ccc";
        input.style.borderRadius = "3px";

        const button = document.createElement("button");
        button.innerText = "Enviar";
        button.style.backgroundColor = "#666";
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "3px";
        button.style.padding = "5px 10px";
        button.style.cursor = "pointer";

        this.output = document.createElement("div");
        this.output.style.marginTop = "10px";
        this.output.style.whiteSpace = "pre-wrap";
        this.output.style.border = "1px solid #e0e0e0";
        this.output.style.padding = "10px";
        this.output.style.borderRadius = "3px";
        this.output.style.backgroundColor = "#fafafa";
        this.output.style.color = "#333";

        button.onclick = () => {
            const pergunta = input.value.trim();
            if (!pergunta) {
                this.output.innerText = "Digite uma pergunta.";
                return;
            }
            if (!this.apiKey) {
                this.output.innerText = "Chave da API não configurada.";
                return;
            }

            this.output.innerText = "Consultando ...";

            fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.nome,
                    messages: [
                        { role: "system", content: this.systemPrompt },
                        { role: "user", content: pergunta }
                    ]
                })
            })
            .then(res => res.json())
            .then(data => {
                const resposta = data.choices?.[0]?.message?.content;
                this.output.innerText = resposta || "Resposta não encontrada.";
            })
            .catch(err => {
                console.error(err);
                this.output.innerText = "Erro na consulta à API.";
            });
        };

        this.container.appendChild(input);
        this.container.appendChild(button);
        this.container.appendChild(this.output);
        options.element.appendChild(this.container);
    }

    public update(options: VisualUpdateOptions) {
        this.settings = VisualSettings.parse<VisualSettings>(options.dataViews?.[0]);
        this.apiKey = this.settings?.apiSettings?.openAiKey || "";
        this.systemPrompt = this.settings?.apiSettings?.systemPrompt || "Você é um assistente útil no Power BI.";
        this.nome = this.settings?.apiSettings?.nome || "gpt-4o";

    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        const settings: VisualSettings = this.settings || new VisualSettings();
        if (options.objectName === "apiSettings") {
            return [{
                objectName: options.objectName,
                properties: {
                    nome: settings.apiSettings.nome,
                    openAiKey: settings.apiSettings.openAiKey,
                    systemPrompt: settings.apiSettings.systemPrompt
                    
                },
                selector: null
            }];
        }
        return [];
    }
}
