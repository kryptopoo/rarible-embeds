export const roundPrice = (price: number, digits: number = 3) => {
    return Math.round((price) * Math.pow(10, digits)) / Math.pow(10, digits);
}