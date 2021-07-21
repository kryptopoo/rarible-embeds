import { RaribleApi } from "./rarible-api";
const QRCode = require('easyqrcodejs');

export class RaribleQr extends HTMLElement {
    private rendered = false;
    private url = "https://rarible.com";

    constructor() {
        super();
    }

    connectedCallback() {
        if (!this.rendered) {
            this.render();
            this.rendered = true;
        }
    }

    public render() {
        console.log('render qr')
        let itemId = this.getAttribute("itemId");
        let api: RaribleApi = new RaribleApi();
        api.getCardInfo(itemId).then((cardInfo) => {
            const shadow = this.attachShadow({ mode: 'open' })

            const qrId = `qr-${cardInfo.id.replace(':', '-')}`

            const template = document.createElement('template')
            template.innerHTML = `<div style="display: inline-block;padding: 24px;" id="${qrId}"></div>`
            shadow.appendChild(template.content.cloneNode(true))

            // Create QRCode Object
            const qrDiv = shadow.querySelector(`#${qrId}`);
            const options = {
                text: `${this.url}/token/${cardInfo.id}`,
                width: 256,
                height: 256,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H, // L, M, Q, H

                backgroundImage: cardInfo.image.url.PREVIEW, // Background Image
                backgroundImageAlpha: 1, // Background image transparency, value between 0 and 1. default is 1. 
                autoColor: true, // Automatic color adjustment(for data block)
                autoColorDark: "rgba(0, 0, 0, .6)", // Automatic color: dark CSS color
                autoColorLight: "rgba(255, 255, 255, .7)", // Automatic color: light CSS color
                // ====== dotScale

                dotScale: 0.5, // For body block, must be greater than 0, less than or equal to 1. default is 1
                dotScaleTiming: 0.5, // Dafault for timing block , must be greater than 0, less than or equal to 1. default is 1
                // dotScaleTiming_H: undefined, // For horizontal timing block, must be greater than 0, less than or equal to 1. default is 1
                // dotScaleTiming_V: undefined, // For vertical timing block, must be greater than 0, less than or equal to 1. default is 1
                dotScaleA: 0.5, // Dafault for alignment block, must be greater than 0, less than or equal to 1. default is 1
                // dotScaleAO: undefined, // For alignment outer block, must be greater than 0, less than or equal to 1. default is 1
                // dotScaleAI: undefined, // For alignment inner block, must be greater than 0, less than or equal to 1. default is 1
            };
            new QRCode(qrDiv, options);
        });
    }
}