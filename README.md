# Rarible Embeds

Super easy for embedding Rarible cards in your website. Support QR code scanning and Buy Now in right there.

## Feature

Embeds Rarible cards in many forms

-   Single cards
-   Multiple cards
-   Cars with Buy Now button integration
-   QR code for specific item

## Usage

1. Add script to your <head> tag:

```
<script src="https://cdn.jsdelivr.net/gh/kryptopoo/rarible-embeds/dist/rarible-embeds.min.js"></script>
```

```
<rarible-card
  itemId="0x71b053bcaf286ba20d9006845412d4532a8e1f34:10694"
  showBuyNow="true"
  env="dev"
  >
</rarible-card>
```

### Parameters

`itemId` : item Id can find at detail card page
e.g. https://rarible.com/token/**0x60f80121c31a0d46b5279700f9df786054aa5ee5:1153174**?tab=bids

`env` : environment should be 'production', 'staging' and 'dev'

`showBuyNow` : show/hide BuyNow button for fixed-price NFT card
