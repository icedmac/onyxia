import { Fragment, useMemo, memo } from "react";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { Icon } from "onyxia-ui/Icon";
import { IconButton } from "onyxia-ui/IconButton";
import { useTranslation } from "ui/i18n";
import { capitalize } from "tsafe/capitalize";
import { MyServicesRoundLogo } from "./MyServicesRoundLogo";
import { MyServicesRunningTime } from "./MyServicesRunningTime";
import { Tag } from "onyxia-ui/Tag";
import { Tooltip } from "onyxia-ui/Tooltip";
import { declareComponentKeys } from "i18nifty";
import { ReadmeAndEnvDialog } from "./ReadmeAndEnvDialog";
import { Evt, NonPostableEvt } from "evt";
import { useConst } from "powerhooks/useConst";
import { useEvt } from "evt/hooks";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { CircularProgress } from "onyxia-ui/CircularProgress";

const runningTimeThreshold = 7 * 24 * 3600 * 1000;

function getDoesHaveBeenRunningForTooLong(params: { startTime: number }): boolean {
    const { startTime } = params;

    return Date.now() - startTime > runningTimeThreshold;
}

export type Props = {
    className?: string;
    evtAction: NonPostableEvt<"SHOW POST INSTALL INSTRUCTIONS">;
    chartIconUrl: string | undefined;
    friendlyName: string;
    chartName: string;
    onRequestDelete: (() => void) | undefined;
    getPoseInstallInstructions: (() => string) | undefined;
    getEnv: () => Record<string, string>;
    projectServicePassword: string;
    openUrl: string | undefined;
    monitoringUrl: string | undefined;
    startTime: number;
    status: "deployed" | "pending" | "failed";
    areAllTasksReady: boolean;
    isShared: boolean;
    isOwned: boolean;
    /** undefined when isOwned === true*/
    ownerUsername: string | undefined;
};

export const MyServicesCard = memo((props: Props) => {
    let {
        className,
        evtAction,
        chartIconUrl,
        friendlyName,
        chartName,
        onRequestDelete,
        getEnv,
        getPoseInstallInstructions,
        projectServicePassword,
        monitoringUrl,
        openUrl,
        startTime,
        status,
        areAllTasksReady,
        isShared,
        isOwned,
        ownerUsername
    } = props;

    //status = "pending";

    const { t } = useTranslation({ MyServicesCard });

    const severity = useMemo(() => {
        if (status === "failed") {
            return "error";
        }

        if (status === "pending" || !areAllTasksReady) {
            return "pending";
        }

        return getDoesHaveBeenRunningForTooLong({ startTime }) ? "warning" : "success";
    }, [status, areAllTasksReady, startTime]);

    const { classes, cx, theme } = useStyles({
        "hasBeenRunningForTooLong": severity === "warning"
    });

    const evtReadmeAndEnvDialogAction = useConst(() =>
        Evt.create<"SHOW ENV" | "SHOW POST INSTALL INSTRUCTIONS">()
    );

    useEvt(
        ctx => {
            evtAction.attach(
                action => action === "SHOW POST INSTALL INSTRUCTIONS",
                ctx,
                async () => {
                    if (getPoseInstallInstructions === undefined) {
                        return;
                    }
                    evtReadmeAndEnvDialogAction.post("SHOW POST INSTALL INSTRUCTIONS");
                }
            );
        },
        [evtAction]
    );

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.aboveDivider}>
                <MyServicesRoundLogo url={chartIconUrl} severity={severity} />
                <Text className={classes.title} typo="object heading">
                    {capitalize(friendlyName)}
                </Text>
                <div style={{ "flex": 1 }} />
                {isShared && (
                    <Tooltip title={t("this is a shared service")}>
                        <Icon icon={id<MuiIconComponentName>("People")} />
                    </Tooltip>
                )}
                <Tooltip
                    title={
                        <Fragment key={"reminder"}>
                            {t("reminder to delete services")}
                        </Fragment>
                    }
                >
                    <Icon
                        icon={id<MuiIconComponentName>("ErrorOutline")}
                        className={classes.errorOutlineIcon}
                    />
                </Tooltip>
            </div>
            <div className={classes.belowDivider}>
                <div className={classes.belowDividerTop}>
                    <div>
                        <Text typo="caption" className={classes.captions}>
                            {t("service")}
                        </Text>
                        <div className={classes.packageNameWrapper}>
                            <Text typo="label 1">{capitalize(chartName)}</Text>
                            {isShared && (
                                <Tag
                                    className={classes.sharedTag}
                                    text={isOwned ? t("shared by you") : ownerUsername!}
                                />
                            )}
                        </div>
                    </div>
                    <div className={classes.timeAndStatusContainer}>
                        <Text typo="caption" className={classes.captions}>
                            {status === "deployed" && areAllTasksReady
                                ? t("running since")
                                : t("helm release status")}
                        </Text>
                        {(() => {
                            switch (status) {
                                case "pending":
                                    return (
                                        <Text typo="label 1">
                                            <code>Pending</code>
                                        </Text>
                                    );
                                case "failed":
                                    return (
                                        <Text typo="label 1">
                                            <code>Failed</code>
                                        </Text>
                                    );
                                case "deployed":
                                    if (!areAllTasksReady) {
                                        return (
                                            <Text typo="label 1">
                                                <code>deployed</code>{" "}
                                                {t("container starting")}
                                                &nbsp;
                                                <CircularProgress
                                                    className={classes.circularProgress}
                                                    size={
                                                        theme.typography.variants[
                                                            "label 1"
                                                        ].style.fontSize
                                                    }
                                                />
                                            </Text>
                                        );
                                    }
                                    return (
                                        <MyServicesRunningTime
                                            doesHaveBeenRunningForTooLong={getDoesHaveBeenRunningForTooLong(
                                                { startTime }
                                            )}
                                            startTime={startTime}
                                        />
                                    );
                            }
                        })()}
                    </div>
                </div>
                <div className={classes.belowDividerBottom}>
                    <IconButton
                        icon={id<MuiIconComponentName>("InfoOutlined")}
                        onClick={() => evtReadmeAndEnvDialogAction.post("SHOW ENV")}
                    />
                    {onRequestDelete !== undefined && (
                        <IconButton
                            icon={id<MuiIconComponentName>("Delete")}
                            onClick={onRequestDelete}
                        />
                    )}
                    {monitoringUrl !== undefined && (
                        <IconButton
                            icon={id<MuiIconComponentName>("Equalizer")}
                            href={monitoringUrl}
                        />
                    )}
                    <div style={{ "flex": 1 }} />
                    {status === "deployed" &&
                        areAllTasksReady &&
                        (openUrl !== undefined ||
                            getPoseInstallInstructions !== undefined) && (
                            <Button
                                onClick={() =>
                                    evtReadmeAndEnvDialogAction.post(
                                        "SHOW POST INSTALL INSTRUCTIONS"
                                    )
                                }
                                variant={openUrl === undefined ? "ternary" : "secondary"}
                            >
                                <span>
                                    {openUrl !== undefined
                                        ? capitalize(t("open"))
                                        : t("readme").toUpperCase()}
                                </span>
                            </Button>
                        )}
                </div>
            </div>
            <ReadmeAndEnvDialog
                evtAction={evtReadmeAndEnvDialogAction}
                getEnv={getEnv}
                getPostInstallInstructions={getPoseInstallInstructions}
                projectServicePassword={projectServicePassword}
                openUrl={openUrl}
                startTime={startTime}
            />
        </div>
    );
});

export const { i18n } = declareComponentKeys<
    | "service"
    | "running since"
    | "open"
    | "readme"
    | "shared by you"
    | "reminder to delete services"
    | "this is a shared service"
    | "helm release status"
    | "container starting"
>()({ MyServicesCard });

const useStyles = tss
    .withParams<{
        hasBeenRunningForTooLong: boolean;
    }>()
    .withName({ MyServicesCard })
    .create(({ theme, hasBeenRunningForTooLong }) => ({
        "root": {
            "borderRadius": 8,
            "boxShadow": theme.shadows[1],
            "backgroundColor": theme.colors.useCases.surfaces.surface1,
            "&:hover": {
                "boxShadow": theme.shadows[6]
            },
            "display": "flex",
            "flexDirection": "column"
        },
        "aboveDivider": {
            "padding": theme.spacing({ "topBottom": 3, "rightLeft": 4 }),
            "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
            "boxSizing": "border-box",
            "display": "flex",
            "alignItems": "center"
        },
        "title": {
            "marginLeft": theme.spacing(3)
        },
        "errorOutlineIcon": !hasBeenRunningForTooLong
            ? { "display": "none" }
            : {
                  "marginLeft": theme.spacing(3),
                  "color": theme.colors.useCases.alertSeverity.warning.main
              },
        "belowDivider": {
            "padding": theme.spacing(4),
            "paddingTop": theme.spacing(3),
            "flex": 1
        },
        "timeAndStatusContainer": {
            "flex": 1,
            "paddingLeft": theme.spacing(6)
        },
        "circularProgress": {
            "color": "inherit",
            "position": "relative",
            "top": 3,
            "left": theme.spacing(2)
        },
        "belowDividerTop": {
            "display": "flex",
            "marginBottom": theme.spacing(4)
        },
        "captions": {
            "display": "inline-block",
            "marginBottom": theme.spacing(2)
        },
        "packageNameWrapper": {
            "& > *": {
                "display": "inline-block"
            }
        },
        "sharedTag": {
            "marginLeft": theme.spacing(2)
        },
        "belowDividerBottom": {
            "display": "flex",
            "alignItems": "center"
        }
    }));
