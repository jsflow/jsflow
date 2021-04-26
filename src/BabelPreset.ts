import preset_env from "@babel/preset-env";

export function JSFLowBabelPreset(this : any) {
    // obviously the @babel/preset-env does more than just return a list, since
    // this preset does not work unless we call the preset.
    preset_env.apply(this, arguments);

    return {
        // load order based on @babel/preset-env self load order reported using the debug flag
        // require returns { default : [Function] }, while plugins should be [ [Function] ]
        plugins: [
            require('@babel/plugin-proposal-nullish-coalescing-operator').default,
            require('@babel/plugin-proposal-optional-chaining').default,
            require('@babel/plugin-proposal-json-strings').default,
            require("@babel/plugin-proposal-optional-catch-binding").default,
            require('@babel/plugin-transform-parameters').default,
            require('@babel/plugin-proposal-async-generator-functions').default,
            require('@babel/plugin-proposal-object-rest-spread').default,
            require('@babel/plugin-transform-dotall-regex').default,
            require('@babel/plugin-proposal-unicode-property-regex').default,
            require('@babel/plugin-transform-named-capturing-groups-regex').default,
            require('@babel/plugin-transform-async-to-generator').default,
            require('@babel/plugin-transform-exponentiation-operator').default,
            require('@babel/plugin-transform-template-literals').default,
            require('@babel/plugin-transform-literals').default,
            require('@babel/plugin-transform-function-name').default,
            require('@babel/plugin-transform-arrow-functions').default,
//            require('@babel/plugin-transform-block-scoped-functions').default,
            require('@babel/plugin-transform-classes').default,
            require('@babel/plugin-transform-object-super').default,
            require('@babel/plugin-transform-shorthand-properties').default,
            require('@babel/plugin-transform-duplicate-keys').default,
            require('@babel/plugin-transform-computed-properties').default,
            require('@babel/plugin-transform-for-of').default,
            require('@babel/plugin-transform-sticky-regex').default,
            require('@babel/plugin-transform-unicode-regex').default,
            require('@babel/plugin-transform-spread').default,
            require('@babel/plugin-transform-destructuring').default,
//            require('@babel/plugin-transform-block-scoping').default,
            require('@babel/plugin-transform-typeof-symbol').default,
//            require('@babel/plugin-transform-new-target').default,
            require('@babel/plugin-transform-regenerator').default,
            require('@babel/plugin-transform-member-expression-literals').default,
            require('@babel/plugin-transform-property-literals').default,
            require('@babel/plugin-transform-reserved-words').default,
            require('@babel/plugin-transform-modules-commonjs').default,
            require('@babel/plugin-proposal-dynamic-import').default
        ]
    };
}
