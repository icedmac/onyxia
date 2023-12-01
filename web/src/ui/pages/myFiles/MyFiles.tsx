import { tss } from "tss";
import { PageHeader } from "onyxia-ui/PageHeader";
import { useEffect, useMemo } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { useCoreState, useCore } from "core";
import { Explorer } from "./Explorer";
import { ExplorerProps } from "./Explorer";
import { useTranslation } from "ui/i18n";
import { routes } from "ui/routes";
import { useSplashScreen } from "onyxia-ui";
import { Evt } from "evt";
import type { CollapseParams } from "onyxia-ui/CollapsibleWrapper";
import type { Param0 } from "tsafe";
import { useStateRef } from "powerhooks/useStateRef";
import { declareComponentKeys } from "i18nifty";
import { useConst } from "powerhooks/useConst";
import type { Link } from "type-route";
import type { PageRoute } from "./route";
import { useEvt } from "evt/hooks";
import { customIcons } from "ui/theme";

export type Props = {
    route: PageRoute;
    className?: string;
};

export default function MyFiles(props: Props) {
    const { className, route } = props;

    const { t } = useTranslation({ MyFiles });

    const currentWorkingDirectoryView = useCoreState(
        "fileExplorer",
        "currentWorkingDirectoryView"
    );

    const commandLogsEntries = useCoreState("fileExplorer", "commandLogsEntries");

    const { isCommandBarEnabled } = useCoreState("userConfigs", "main");

    const { fileExplorer } = useCore().functions;

    const { evtProjectConfigs } = useCore().evts;

    useEvt(
        ctx => {
            evtProjectConfigs.attach(
                action => action.actionName === "projectChanged",
                ctx,
                () => routes[route.name]({ "path": undefined }).replace()
            );
        },
        [evtProjectConfigs]
    );

    useEffect(() => {
        if (route.params.path === undefined) {
            routes[route.name]({
                "path": fileExplorer.getProjectHomeOrPreviousPath()
            }).replace();
            return;
        }

        fileExplorer.navigate({
            "directoryPath": route.params.path
        });
    }, [route.params.path]);

    const onNavigate = useConstCallback(
        ({ directoryPath }: Param0<ExplorerProps["onNavigate"]>) =>
            routes[route.name]({ "path": directoryPath }).push()
    );

    const onRefresh = useConstCallback(() => fileExplorer.refresh());

    const onCreateDirectory = useConstCallback(
        ({ basename }: Param0<ExplorerProps["onCreateDirectory"]>) =>
            fileExplorer.create({
                "createWhat": "directory",
                basename
            })
    );

    const onDeleteItem = useConstCallback(
        ({ kind, basename }: Param0<ExplorerProps["onDeleteItem"]>) =>
            fileExplorer.delete({
                "deleteWhat": kind,
                basename
            })
    );

    const onCopyPath = useConstCallback(({ path }: Param0<ExplorerProps["onCopyPath"]>) =>
        copyToClipboard(path.split("/").slice(2).join("/"))
    );

    const { classes, cx } = useStyles();

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        if (currentWorkingDirectoryView === undefined) {
            showSplashScreen({ "enableTransparency": true });
        } else {
            hideSplashScreen();
        }
    }, [currentWorkingDirectoryView === undefined]);

    const evtExplorerAction = useConst(() => Evt.create<ExplorerProps["evtAction"]>());

    const scrollableDivRef = useStateRef<HTMLDivElement>(null);

    const titleCollapseParams = useMemo(
        (): CollapseParams => ({
            "behavior": "collapses on scroll",
            "scrollTopThreshold": 100,
            "scrollableElementRef": scrollableDivRef
        }),
        []
    );

    const helpCollapseParams = useMemo(
        (): CollapseParams => ({
            "behavior": "collapses on scroll",
            "scrollTopThreshold": 50,
            "scrollableElementRef": scrollableDivRef
        }),
        []
    );

    const onOpenFile = useConstCallback<
        Extract<ExplorerProps, { isFileOpen: false }>["onOpenFile"]
    >(({ basename }) => {
        if (basename.endsWith(".parquet") || basename.endsWith(".s3")) {
            routes
                .dataExplorer({
                    "source": `s3:/${route.params.path}/${basename}`
                })
                .push();
            return;
        }

        fileExplorer.getFileDownloadUrl({ basename }).then(window.open);
    });

    const onFileSelected = useConstCallback<ExplorerProps["onFileSelected"]>(
        ({ files }) =>
            files.forEach(file =>
                fileExplorer.create({
                    "createWhat": "file",
                    "basename": file.name,
                    "blob": file
                })
            )
    );

    const uploadProgress = useCoreState("fileExplorer", "uploadProgress");

    if (currentWorkingDirectoryView === undefined) {
        return null;
    }

    return (
        <div className={cx(classes.root, className)}>
            <PageHeader
                mainIcon={customIcons.filesSvgUrl}
                title={t("page title - my files")}
                helpTitle={t("what this page is used for - my files")}
                helpContent={t("help content", {
                    "docHref":
                        "https://docs.sspcloud.fr/onyxia-guide/utiliser-des-variables-denvironnement",
                    "accountTabLink": routes.account({ "tabId": "storage" }).link
                })}
                helpIcon="sentimentSatisfied"
                titleCollapseParams={titleCollapseParams}
                helpCollapseParams={helpCollapseParams}
            />
            <Explorer
                onFileSelected={onFileSelected}
                filesBeingUploaded={uploadProgress.s3FilesBeingUploaded}
                className={classes.explorer}
                doShowHidden={false}
                directoryPath={currentWorkingDirectoryView.directoryPath}
                isNavigating={currentWorkingDirectoryView.isNavigationOngoing}
                commandLogsEntries={commandLogsEntries}
                evtAction={evtExplorerAction}
                files={currentWorkingDirectoryView.files}
                directories={currentWorkingDirectoryView.directories}
                directoriesBeingCreated={
                    currentWorkingDirectoryView.directoriesBeingCreated
                }
                filesBeingCreated={currentWorkingDirectoryView.filesBeingCreated}
                onNavigate={onNavigate}
                onRefresh={onRefresh}
                onDeleteItem={onDeleteItem}
                onCreateDirectory={onCreateDirectory}
                onCopyPath={onCopyPath}
                pathMinDepth={1}
                scrollableDivRef={scrollableDivRef}
                {...{
                    "isFileOpen": false as const,
                    onOpenFile
                }}
                isCommandBarEnabled={isCommandBarEnabled}
            />
        </div>
    );
}

export const { i18n } = declareComponentKeys<
    | "page title - my files"
    | "page title - my secrets"
    | "what this page is used for - my files"
    | "what this page is used for - my secrets"
    | {
          K: "help content";
          P: {
              docHref: string;
              accountTabLink: Link;
          };
          R: JSX.Element;
      }
>()({ MyFiles });

const useStyles = tss.withName({ MyFiles }).create({
    "root": {
        "height": "100%",
        "display": "flex",
        "flexDirection": "column"
    },
    "explorer": {
        "overflow": "hidden",
        "flex": 1,
        "width": "100%"
    }
});
