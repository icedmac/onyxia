import type { Thunks } from "core/bootstrap";
import * as projectManagement from "core/usecases/projectManagement";
import structuredClone from "@ungap/structured-clone";
import { assert } from "tsafe/assert";

export const thunks = {
    "deleteCustomS3Config":
        (params: { customS3ConfigId: number }) =>
        async (...args) => {
            const { customS3ConfigId: customS3ConfigIndex } = params;

            const [dispatch, getState] = args;

            const s3 = structuredClone(
                projectManagement.protectedSelectors.currentProjectConfigs(getState()).s3
            );

            assert(s3.customConfigs[customS3ConfigIndex] !== undefined);

            if (s3.indexForExplorer === customS3ConfigIndex) {
                s3.indexForExplorer = undefined;
            }

            if (s3.indexForXOnyxia === customS3ConfigIndex) {
                s3.indexForXOnyxia = undefined;
            }

            s3.customConfigs.splice(customS3ConfigIndex, 1);

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    "key": "s3",
                    "value": s3
                })
            );
        },
    "addCustomS3Config":
        (params: {
            customS3Config: projectManagement.ProjectConfigs.CustomS3Config & {
                isUsedForXOnyxia: boolean;
                isUsedForExplorer: boolean;
            };
        }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const {
                customS3Config: { isUsedForXOnyxia, isUsedForExplorer, ...customS3Config }
            } = params;

            const s3 = structuredClone(
                projectManagement.protectedSelectors.currentProjectConfigs(getState()).s3
            );

            s3.customConfigs.push({
                ...customS3Config,
                "workingDirectoryPath": customS3Config.workingDirectoryPath
                    .trim()
                    .replace(/\/\//g, "/") // Remove double slashes if any
                    .replace(/^\//g, "") // Ensure no leading slash
                    .replace(/\/?$/g, "/") // Enforce trailing slash
            });

            {
                const newIndex = s3.customConfigs.length - 1;

                if (isUsedForXOnyxia) {
                    s3.indexForXOnyxia = newIndex;
                }

                if (isUsedForExplorer) {
                    s3.indexForExplorer = newIndex;
                }
            }

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    "key": "s3",
                    "value": s3
                })
            );
        },
    "setConfigUsage":
        (params: {
            /** Undefined for SES config */
            customS3ConfigId: number | undefined;
            usedFor: "xOnyxia" | "explorer";
            isUsed: boolean;
        }) =>
        async (...args) => {
            const { customS3ConfigId: customS3ConfigIndex, usedFor, isUsed } = params;

            const [dispatch, getState] = args;

            const s3 = structuredClone(
                projectManagement.protectedSelectors.currentProjectConfigs(getState()).s3
            );

            if (customS3ConfigIndex === undefined) {
                assert(isUsed, "The switch should be disabled");

                switch (usedFor) {
                    case "explorer":
                        s3.indexForExplorer = undefined;
                        break;
                    case "xOnyxia":
                        s3.indexForXOnyxia = undefined;
                        break;
                }
            } else {
                assert(s3.customConfigs[customS3ConfigIndex] !== undefined);

                const index = isUsed ? customS3ConfigIndex : undefined;

                switch (usedFor) {
                    case "explorer":
                        s3.indexForExplorer = index;
                        break;
                    case "xOnyxia":
                        s3.indexForXOnyxia = index;
                        break;
                }
            }

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    "key": "s3",
                    "value": s3
                })
            );
        }
} satisfies Thunks;
