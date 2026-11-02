const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const assetPack = require("../public/assets/asset-pack.json");

function assetPatterns() {
  const files = new Set(["assets/asset-pack.json", "style.css"]);
  assetPack.section1.files.forEach((asset) => {
    [asset.url].flat().forEach((url) => files.add(path.posix.normalize(`assets/${url}`)));
  });
  return [...files].map((file) => ({ from: `public/${file}`, to: file }));
}

function createPlugins(production, poki) {
  return [
    new webpack.DefinePlugin({
      "typeof CANVAS_RENDERER": JSON.stringify(true),
      "typeof WEBGL_RENDERER": JSON.stringify(true),
      "typeof WEBGL_DEBUG": JSON.stringify(!production),
      "typeof EXPERIMENTAL": JSON.stringify(!production),
      "typeof PLUGIN_3D": JSON.stringify(false),
      "typeof PLUGIN_CAMERA3D": JSON.stringify(false),
      "typeof PLUGIN_FBINSTANT": JSON.stringify(false),
      "typeof FEATURE_SOUND": JSON.stringify(true),
      POKI_SDK: JSON.stringify(poki),
      DEV_TOOLS: JSON.stringify(!production)
    }),
    new HtmlWebpackPlugin({ template: "./index.html" }),
    new CopyPlugin({
      patterns: [
        ...assetPatterns(),
        { from: "licenses", to: "licenses" },
        { from: "THIRD_PARTY_NOTICES.md", to: "THIRD_PARTY_NOTICES.md" }
      ]
    })
  ];
}

module.exports = function createConfig({ production = false, poki = false } = {}) {
  return {
    mode: production ? "production" : "development",
    entry: "./src/main.ts",
    output: {
      path: path.resolve(process.cwd(), poki ? "dist-poki" : "dist"),
      filename: "bundle.min.js",
      clean: true
    },
    resolve: { extensions: [".ts", ".js", ".json"] },
    devtool: production ? false : "eval-source-map",
    module: {
      rules: [{ test: /\.tsx?$/, exclude: /node_modules/, loader: "ts-loader" }]
    },
    performance: { maxEntrypointSize: 1200000, maxAssetSize: 1200000 },
    plugins: createPlugins(production, poki),
    ...(!production ? {
      devServer: {
        static: { directory: path.resolve(__dirname, "../public") },
        compress: true,
        host: "127.0.0.1",
        port: 8080
      }
    } : {})
  };
};
