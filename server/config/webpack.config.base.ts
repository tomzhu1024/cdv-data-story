import { userConfig } from "./user.config";
import path from "path";
import chalk from "chalk";
import webpack from "webpack";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { CheckerPlugin } from "awesome-typescript-loader";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import AntdDayjsWebpackPlugin from "antd-dayjs-webpack-plugin";
import LodashWebpackPlugin from "lodash-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import ProgressBarWebpackPlugin from "progress-bar-webpack-plugin";
import { getThemeVariables } from "antd/dist/theme";

const isDevMode = process.env.NODE_ENV === "development";

export const baseConfig: webpack.Configuration = {
    mode: isDevMode ? "development" : "production",
    entry: {
        index: [path.resolve(userConfig.projectRoot, "src/scripts/index.jsx")]
    },
    output: {
        path: path.resolve(userConfig.projectRoot, "dist"),
        filename: "[name].bundle.js",
        publicPath: "./"
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/i,
                exclude: /node_modules/,
                use: ["babel-loader"]
            },
            {
                test: /\.tsx?$/i,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "awesome-typescript-loader",
                        options: {
                            silent: true,
                            useCache: true,
                            reportFiles: ["src/**/*.{ts,tsx}"]
                        }
                    }
                ]
            },
            {
                test: /\.css$/i,
                use: [
                    isDevMode ? "style-loader" : MiniCssExtractPlugin.loader,
                    "css-loader"
                ]
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    isDevMode ? "style-loader" : MiniCssExtractPlugin.loader,
                    "css-loader",
                    "sass-loader"
                ]
            },
            {
                test: /\.less$/i,
                use: [
                    isDevMode ? "style-loader" : MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "less-loader",
                        options: {
                            lessOptions: {
                                javascriptEnabled: true,
                            },
                        },
                    }
                ]
            },
            {
                test: /\.(png|jpg|gif|woff2?)$/i,
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            name: "[name].[ext]",
                            esModule: false,
                            limit: 1024
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CheckerPlugin(),
        ...(isDevMode ? [] : [new MiniCssExtractPlugin()]),
        new AntdDayjsWebpackPlugin(),
        new LodashWebpackPlugin(),
        new ProgressBarWebpackPlugin({
            total: 25,
            complete: chalk.bgHex(userConfig.colors.yellow)(" "),
            incomplete: chalk.bgHex(userConfig.colors.white)(" "),
            format: `${chalk.hex(userConfig.colors.blue)("* Webpack ")}:bar${chalk.hex(userConfig.colors.blue)(" :msg (:percent)")}`,
            summary: false,
            clear: true
        }),
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: path.resolve(userConfig.projectRoot, "src/templates/index.ejs"),
            minify: !isDevMode,
            chunks: ["index"]
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(userConfig.projectRoot, "src/static"),
                    to: path.resolve(userConfig.projectRoot, "dist")
                }
            ]
        })
    ],
    resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx", ".json"]
    }
};
