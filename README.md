# Parser for Jupiter V6 Contract

A library you can use to parse the Jupiter v6 swap instruction. It is also the same library that we use to parse the swap information on the https://station.jup.ag/stats page.

After cloning the repo, in the project directory run `yarn install`. Then:


```
yarn start lookup-tx --signature <TRANSACTION_SIGNATURE> --rpc <RPC_URL>
```

For an example on how to use the library, you can check out: `src/cli.ts`.

## NPM

If you are using this via NPM, make sure that you are using the right version for the right contract:

* `JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB`: `1.0.5`
* `JUP5pEAZeHdHrLxh5UCwAbpjGwYKKoquCpda2hfP4u8`: `5.0.1`
* `JUP5cHjnnCx2DppVsufsLrXs8EBZeEZzGtEK9Gdz6ow`: `5.2.0`
* `JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4`: `6.0.7`

If you will need all of them in order to parse different contract, you can include them in your `package.json` as this:

```json
{
  "dependencies": {
    "@jup-ag/instruction-parser-v4": "npm:@jup-ag/instruction-parser@1.0.5",
    "@jup-ag/instruction-parser-v5": "npm:@jup-ag/instruction-parser@5.0.1",
    "@jup-ag/instruction-parser-v5-1": "npm:@jup-ag/instruction-parser@5.2.0",
    "@jup-ag/instruction-parser-v6": "npm:@jup-ag/instruction-parser@6.0.7"
  }
}
```

## Note

We are using Anchor events for extracting swap details. One downside about this approach is that we cannot longer extract swap details if the log is being truncated.

## Jupiter V4 Contract

For the old V4 contract, check out [v4 tag](https://github.com/jup-ag/instruction-parser/tree/v4).

## Jupiter V3 Contract

For the old V3 contract, check out [v3 tag](https://github.com/jup-ag/instruction-parser/tree/v3).