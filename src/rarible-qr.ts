import { Config } from './config'
import { RaribleApi } from './rarible-api'
const QRCode = require('easyqrcodejs')

export class RaribleQr extends HTMLElement {
    private rendered = false
    private config: Config

    constructor() {
        super()
    }

    connectedCallback() {
        if (!this.rendered) {
            this.render()
            this.rendered = true
        }
    }

    public render() {
        const itemId = this.getAttribute('itemId')
        this.config = new Config(this.getAttribute('env'))

        const api: RaribleApi = new RaribleApi(this.config.ProtocolApiUrl, this.config.MarketplaceApiUrl)
        api.getItemMetaById(itemId).then((res) => {
            const itemMetaData = res.data
            console.log('itemMetaData', itemMetaData)
            const shadow = this.attachShadow({ mode: 'open' })

            const qrId = `qr-${itemId.replace(':', '-')}`

            const template = document.createElement('template')
            template.innerHTML = `<div style="display: inline-block;padding: 24px;" id="${qrId}"></div>`
            shadow.appendChild(template.content.cloneNode(true))

            // Create QRCode Object
            const qrDiv = shadow.querySelector(`#${qrId}`)
            const options = {
                text: `${this.config.getItemUrl(itemId)}`,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H, // L, M, Q, H

                // ====== backgroundImage
                backgroundImage: this.config.getImageUrl(itemMetaData.image.url.PREVIEW ?? itemMetaData.image.url.ORIGINAL), // Background Image
                backgroundImageAlpha: 1, // Background image transparency, value between 0 and 1. default is 1.
                autoColor: true, // Automatic color adjustment(for data block)
                autoColorDark: 'rgba(0, 0, 0, .6)', // Automatic color: dark CSS color
                autoColorLight: 'rgba(255, 255, 255, .7)', // Automatic color: light CSS color

                // ====== dotScale
                dotScale: 0.5, // For body block, must be greater than 0, less than or equal to 1. default is 1
                dotScaleTiming: 0.5, // Dafault for timing block , must be greater than 0, less than or equal to 1. default is 1
                dotScaleA: 0.5 // Dafault for alignment block, must be greater than 0, less than or equal to 1. default is 1

                // ====== title
                // title: `${cardInfo.name}`, // content
                // titleHeight: 40, // height, including subTitle. default is 0
                // titleTop: 30, // draws y coordinates. default is 30
            }
            new QRCode(qrDiv, options)
        })
    }
}
