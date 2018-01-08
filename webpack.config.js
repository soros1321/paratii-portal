var webpack = require("webpack");
var UglifyJsPlugin = require("uglifyjs-webpack-plugin");
var path = require("path");

var srcDir = path.resolve(__dirname, "src");
var scriptsDir = srcDir + "/scripts";
var assetsDir = srcDir + "/assets";
var stylesDir = srcDir + "/styles";
var buildDir = path.resolve(__dirname, "build");
var testDir = path.resolve(__dirname, "test");
var unitTestsDir = testDir + "/unit-tests";
var functionalTestsDir = testDir + "/functional-tests";

var prod = process.env.NODE_ENV === "production";

var config = {
  entry: prod
    ? [scriptsDir + "/index.js"]
    : [
        "react-hot-loader/patch",
        scriptsDir + "/index.js",
        "webpack-hot-middleware/client?quiet=true"
      ],
  output: {
    path: buildDir,
    publicPath: "/",
    filename: "bundle.js"
  },
  resolve: {
    alias: {
      scripts: scriptsDir,
      styles: stylesDir,
      assets: assetsDir,
      components: scriptsDir + "/components",
      constants: scriptsDir + "/constants",
      actions: scriptsDir + "/actions",
      reducers: scriptsDir + "/reducers",
      records: scriptsDir + "/records",
      containers: scriptsDir + "/containers",
      selectors: scriptsDir + "/selectors",
      apis: scriptsDir + "/apis",
      adapters: scriptsDir + "/adapters",
      types: scriptsDir + "/types",
      utils: scriptsDir + "/utils",
      "test-utils": testDir + "/test-utils",
      "unit-tests": unitTestsDir,
      "functional-tests": functionalTestsDir
    }
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        include: [srcDir, testDir],
        loader: "babel-loader",
      },
      {
        test: /\.(png|jpg|gif)$/,
        include: assetsDir,
        use: [
          {
            loader: "file-loader",
            options: {
              outputPath: "assets/"
            }
          }
        ]
      },
      {
        test: /\.scss$/,
        include: stylesDir,
        use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"]
      }
    ]
  },
  devtool: prod ? undefined : "eval-source-map",
  devServer: prod
    ? {}
    : {
        hot: true
      },
  plugins: prod
    ? [
        new webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify("production")
        }),
        new UglifyJsPlugin({
          uglifyOptions: {
            ecma: 6
          }
        })
      ]
    : [new webpack.HotModuleReplacementPlugin()]
};

module.exports = config;
