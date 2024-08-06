# Tips and Tricks

## Developer roadmap

> Application must be installed with the specific versions of node, npm and yarn specified in the repository otherwise will give errors anywhere.

## TODO

- Separate packages from client and server.
- Replace deprecated packges and update the remaining packages.
- Completly recreate the frontend and backend using typescript.
- Refactor client to use react functional cmoponents instead of class components.
  - Suggestions: Use material design in react client.
- Reestructure the states, props and variables to avoid type changes (possibly in conjunction with typescript implementation)
- Realtime pattern matching for phone code on login or phone verification (possibly no neccesary if use React Material).
- Realtime pattern matching for email code on login or email verification (possibly no neccesary if use React Material).

### Using NodeJS v18

```bash
npm i @babel/register @types/morgan add autoprefixer axios bytes compression concurrently cookie-parser cookie-signature core-js deep-object-diff deepmerge dompurify duration-formatter express fs-extra history inquirer js-yaml jsdom lodash marked morgan node-plop nodemon pretty-bytes prop-types qs raf react react-cookie react-countdown react-dom react-helmet react-infinite-scroll-component react-phone-input-2 react-redux react-router-dom react-select react-toastify redux redux-thunk regenerator-runtime tsutils ttag universal-cookie-express winston winston-transport-sentry-node
```

```bash
npm i -D @babel/cli @babel/core @babel/preset-env @babel/plugin-transform-runtime @babel/plugin-proposal-class-properties @babel/plugin-syntax-dynamic-import @babel/plugin-transform-arrow-functions @babel/plugin-transform-classes @babel/plugin-transform-runtime @babel/plugin-transform-spread @babel/polyfill @babel/preset-env @babel/preset-react @babel/runtime babel-eslint babel-loader babel-plugin-transform-remove-strict-mode brotli-webpack-plugin clean-webpack-plugin compression-webpack-plugin copy-webpack-plugin coveralls css-loader enzyme enzyme-adapter-react-16 enzyme-to-json eslint eslint-config-airbnb eslint-config-jest-enzyme eslint-config-prettier eslint-config-react eslint-loader eslint-plugin-import eslint-plugin-jest eslint-plugin-jsx-a11y eslint-plugin-prettier eslint-plugin-react eslint-plugin-react-hooks file-loader hard-source-webpack-plugin html-webpack-plugin jest mini-css-extract-plugin mock-local-storage optimize-css-assets-webpack-plugin prettier react-test-renderer redux-mock-store remove-strict-webpack-plugin selenium-webdriver style-loader terser-webpack-plugin ttag-cli typescript uglifyjs-webpack-plugin webpack webpack-bundle-analyzer webpack-cli webpack-dev-server
```

```conf
Mock Server
captive_portal_login_form: https://wifiauth.servinfo.com.uy:3991/logon
captive_portal_logout_form: https://wifiauth.servinfo.com.uy:3991/logout
host: https://colsecor.servinfo.com.uy
uuid: 6385d909-dced-419d-812b-ffba46b3b0f2
secret_key: 21CS5GGTKLnXntRE0dyHHqo8uyf836xZ
```

```conf
Mock Server
captive_portal_login_form: https://wifiauth.servinfo.com.uy:3991/logon
captive_portal_logout_form: https://wifiauth.servinfo.com.uy:3991/logout
slug: colsecor
host: http://localhost:8000
uuid: b80b60e2-f003-478c-801a-3ae3f28107ef
secret_key: spZPm13O3Hk6Mq2cVkpDhU6kT8B2LS4S
```