import { baseConfig } from "./webpack.config.base";
import merge from "webpack-merge";
import webpack, { Configuration as WebpackConfiguration } from "webpack";
import FriendlyErrorWebpackPlugin from "@soda/friendly-errors-webpack-plugin";
import { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";

interface Configuration extends WebpackConfiguration {
    devServer?: WebpackDevServerConfiguration;
}

export const devConfig: Configuration = merge<Configuration>(baseConfig, {
    stats: false,
    devtool: "eval-cheap-module-source-map",
    devServer: {
        writeToDisk: true,
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new FriendlyErrorWebpackPlugin(),
    ],
    resolve: {
        alias: {
            "react-dom": "@hot-loader/react-dom",
        },
    },
});
