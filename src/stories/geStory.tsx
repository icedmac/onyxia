

import type { Meta } from "@storybook/react";
import { symToStr } from "app/utils/symToStr";
import type { Story } from "@storybook/react";
import React from "react";
import { ThemeProviderFactory } from "app/ThemeProvider";
import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import { id } from "evt/tools/typeSafety/id";
import { I18nProvider } from "app/i18n/I18nProvider";
import type { SupportedLanguages } from "app/i18n/resources";
import { StoreProvider } from "app/lib/StoreProvider";
import type { OidcClientConfig, SecretsManagerClientConfig, OnyxiaApiClientConfig } from "lib/setup";
import type { Props as StoreProviderProps } from "app/lib/StoreProvider";

const { ThemeProvider } = ThemeProviderFactory(
    { "isReactStrictModeEnabled": false }
);

const createStoreParams: StoreProviderProps["createStoreParams"] = {
    "isOsPrefersColorSchemeDark": false,
    "oidcClientConfig": id<OidcClientConfig.InMemory>({
        "doUseInMemoryClient": true,
        "tokenValidityDurationMs": 60 * 60 * 1000,
        "parsedJwt": {
            "email": "john.doe@insee.fr",
            "preferred_username": "doej"
        }
    }),
    "secretsManagerClientConfig": id<SecretsManagerClientConfig.InMemory>({
        "doUseInMemoryClient": true
    }),
    "onyxiaApiClientConfig": id<OnyxiaApiClientConfig.InMemory>({
        "doUseInMemoryClient": true,
        "ip": "185.24.1.1",
        "nomComplet": "John Doe"
    })
};

export function getStoryFactory<Props>(params: {
    sectionName: string;
    wrappedComponent: Record<string, (props: Props) => ReturnType<React.FC>>;
    doProvideMockStore?: boolean;
}) {

    const {
        sectionName,
        wrappedComponent,
        doProvideMockStore = false
    } = params;

    const Component: any = Object.entries(wrappedComponent).map(([, component]) => component)[0];

    const StoreProviderOrFragment: React.FC = !doProvideMockStore ?
        ({ children }) => <>{children}</> :
        ({ children }) => <StoreProvider createStoreParams={createStoreParams}>{children}</StoreProvider>;

    const Template: Story<Props & { darkMode: boolean; lng: SupportedLanguages; }> =
        ({ darkMode, lng, ...props }) => {
            return (
                <I18nProvider lng={lng}>
                    <ThemeProvider isDarkModeEnabled={darkMode}>
                        <Box p={4}>
                            <Box clone p={4} m={2} display="inline-block">
                                <Paper>
                                    <StoreProviderOrFragment>
                                        <Component {...props} />
                                    </StoreProviderOrFragment>
                                </Paper>
                            </Box>
                        </Box>
                    </ThemeProvider>
                </I18nProvider>
            );
        }


    function getStory(props: Props): typeof Template {

        const out = Template.bind({});

        out.args = {
            "darkMode": false,
            "lng": id<SupportedLanguages>("fr"),
            ...props
        };

        return out;

    }

    return {
        "meta": id<Meta>({
            "title": `${sectionName}/${symToStr(wrappedComponent)}`,
            "component": Component,
            // https://storybook.js.org/docs/react/essentials/controls
            "argTypes": {
                "lng": {
                    "control": {
                        "type": "inline-radio",
                        "options": id<SupportedLanguages[]>(["fr", "en"]),
                    }
                }
            }
        }),
        getStory
    };

}

export function logCallbacks<T extends string>(propertyNames: readonly T[]): Record<T, () => void> {

    const out: Record<T, () => void> = {} as any;

    propertyNames.forEach(propertyName => out[propertyName] = console.log.bind(console, propertyName));

    return out;

}

