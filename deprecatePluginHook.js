/**
 *******************************************************
 *                                                     *
 *   Copyright (C) Microsoft. All rights reserved.     *
 *                                                     *
 *******************************************************
 */
console.error("\x1b[31m");
console.error("##################################################################");
console.error("'cordova-plugin-livereload' has been deprecated!!!");
console.error("Please use 'taco run --livereload' instead.");
console.error("For more information please visit http://taco.tools/docs/run.html.");
console.error("##################################################################");
console.error();
Error.stackTraceLimit = 0;
throw new Error("Deprecated Plugin 'cordova-plugin-livereload'");
