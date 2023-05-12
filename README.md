# Parser for Jupiter V4 Contract

A library you can use to parse the Jupiter v4 swap instruction. It is also the same library that we use to parse the swap information on the https://station.jup.ag/stats page.

After cloning the repo, in the project directory run `yarn install`. Then:


```
yarn start lookup-tx --signature <TRANSACTION_SIGNATURE> --rpc <RPC_URL>
```

For an example on how to use the library, you can check out: `src/cli.ts`.

## Jupiter V3 Contract

For the old V3 contract, check out [v3 tag](https://github.com/jup-ag/instruction-parser/tree/v3).