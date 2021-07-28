export const roundPrice = (price: number, digits: number = 3) => {
    return Math.round(price * Math.pow(10, digits)) / Math.pow(10, digits)
}

export const shortAddress = (addr: string) => {
    // 0x0428744f4...d358
    return `${addr.substr(0, 10)}...${addr.substr(addr.length - 5, 5)} `
}

export const decorateCurrency = (symbol: string) => {
    if (symbol === 'WETH') return 'wETH'

    return symbol
}

export class ShareLinkBuilder {
    public static buildTwitterShareLink = (itemUrl: string, itemName: string) => {
        const text = `I have just purchased ${itemName} collectible!`
        return `https://twitter.com/intent/tweet?url=${itemUrl}&text=${text}`
    }

    public static buildFacebookShareLink = (itemUrl: string, itemName: string) => {
        const text = `I have just purchased ${itemName} collectible!`
        return `https://www.facebook.com/sharer/sharer.php?u=${itemUrl}&quote=${text}`
    }

    public static buildTelegramShareLink = (itemUrl: string, itemName: string) => {
        const text = `I have just purchased ${itemName} collectible!`
        return `https://telegram.me/share/?url=${itemUrl}&title=${text}`
    }

    public static buildEmailShareLink = (itemUrl: string, itemName: string) => {
        const subject = `I have just purchased ${itemName} collectible!`
        const body = `Look what I just purchased: ${itemUrl}`
        return `mailto:?subject=${subject}&body=${body}`
    }
}
