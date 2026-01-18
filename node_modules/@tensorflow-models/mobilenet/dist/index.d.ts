/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as tf from '@tensorflow/tfjs-core';
export { version } from './version';
/** @docinline */
export declare type MobileNetVersion = 1 | 2;
/** @docinline */
export declare type MobileNetAlpha = 0.25 | 0.50 | 0.75 | 1.0;
/**
 * Mobilenet model loading configuration
 *
 * Users should provide a version and alpha *OR* a modelURL and inputRange.
 */
export interface ModelConfig {
    /**
     * The MobileNet version number. Use 1 for MobileNetV1, and 2 for
     * MobileNetV2. Defaults to 1.
     */
    version: MobileNetVersion;
    /**
     * Controls the width of the network, trading accuracy for performance. A
     * smaller alpha decreases accuracy and increases performance. Defaults
     * to 1.0.
     */
    alpha?: MobileNetAlpha;
    /**
     * Optional param for specifying the custom model url or an `tf.io.IOHandler`
     * object.
     */
    modelUrl?: string | tf.io.IOHandler;
    /**
     * The input range expected by the trained model hosted at the modelUrl. This
     * is typically [0, 1] or [-1, 1].
     */
    inputRange?: [number, number];
}
export interface MobileNetInfo {
    url: string;
    inputRange: [number, number];
}
export declare function load(modelConfig?: ModelConfig): Promise<MobileNet>;
export interface MobileNet {
    load(): Promise<void>;
    infer(img: tf.Tensor | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, embedding?: boolean): tf.Tensor;
    classify(img: tf.Tensor3D | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, topk?: number): Promise<Array<{
        className: string;
        probability: number;
    }>>;
}
