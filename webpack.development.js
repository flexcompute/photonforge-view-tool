/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require("webpack");
const path = require("path");

const fs = require("fs");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf-8"));

module.exports = (env) => {
    const devConfig = {
        mode: env.mode,
        devtool: "inline-source-map",
        devServer: {
            open: false,
            allowedHosts: "all",
            https: true,
            port: 443,
            webSocketServer: false,
        },
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: "swc-loader",
                        options: {
                            jsc: {
                                parser: {
                                    syntax: "typescript",
                                },
                            },
                        },
                    },
                },
            ],
        },
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "[name].js",
            library: "PhotonForgeViewTool",
            libraryExport: "default",
        },

        plugins: [
            new MiniCssExtractPlugin({
                filename: "[name].css",
            }),
            new ESLintPlugin(),
            new webpack.DefinePlugin({
                VERSION: JSON.stringify(pkg.version + "dev"),
            }),
        ],
    };

    return devConfig;
};
