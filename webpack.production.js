/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require("webpack");
const path = require("path");

const fs = require("fs");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf-8"));

module.exports = (env) => {
    return {
        mode: env.mode,

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
            filename: `photonForge-view.${new Date().getTime()}.js`,
            library: "PhotonForgeViewTool",
            libraryExport: "default",
        },

        optimization: {
            minimize: true,
            minimizer: [
                // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
                new TerserPlugin({
                    minify: TerserPlugin.swcMinify,
                    extractComments: false,
                }),
                new CssMinimizerPlugin(),
            ],
        },

        plugins: [
            new MiniCssExtractPlugin({
                filename: "[name].[contenthash].css",
            }),
            new webpack.DefinePlugin({
                VERSION: JSON.stringify(pkg.version + "r"),
            }),
            new ESLintPlugin({
                emitError: true,
                emitWarning: true,
                failOnError: true,
                failOnWarning: true,
            }),
            new webpack.ProgressPlugin(),
            new BundleAnalyzerPlugin({
                analyzerMode: "static", // 模式server, static, json, disabled
                analyzerHost: "127.0.0.1", // 默认是127.0.0.1，这个字段在analyzerMode为server模式的时候才会起作用
                analyzerPort: 8889,
                reportFilename: "report.html", // 生成的文件的名字
                defaultSizes: "parsed", // stat, parsed, gzip,这个字段决定了当生成了分析文件之后默认的筛选项
                openAnalyzer: true,
                generateStatsFile: false,
                statsFilename: "stats.json",
                statsOptions: null,
                logLevel: "info",
            }),
        ],
    };
};
