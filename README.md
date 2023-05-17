This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Adding custom metadata

To add custom metadata and/or extend the default metadata for a collection, create a directory in `src/extend` containing an `index.js` file (See [src/extend/forgotten-ponies/index.js](src/extend/forgotten-ponies/index.js) for example). Example directory structure:

```
src/extend
.
├── my-contract                   # Directory for your collection with custom metadata
│   ├── index.js                  # Implement required functions and customize metadata
│   ├── ...                       # If needed, data files or other helpers can also go in this directory
└── ...
```

An update is also required in [src/extend/index.js](src/extend/index.js):

```
import * as myContract from "./my-contract";

extend["${CHAIN_ID},${YOUR_CONTRACT}"] = myContract;
```

### Testing

You can test the custom metadata response at `http://localhost:3000/api/v4/mainnet/metadata/token?method=opensea&token=YOUR_CONTRACT:TOKEN_ID`





