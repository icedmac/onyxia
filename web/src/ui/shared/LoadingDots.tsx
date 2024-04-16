import Box from "@mui/material/Box";
import { tss } from "tss";
import { keyframes } from "tss-react";

export type LoadingDotsProps = {
    className?: string;
};

export function LoadingDots(props: LoadingDotsProps) {
    const { className } = props;

    const { classes, cx } = useStyles();
    return (
        <Box className={cx(classes.root, className)}>
            <div className={classes.dot} />
            <div className={classes.dot} />
            <div className={classes.dot} />
        </Box>
    );
}

const useStyles = tss.withName({ LoadingDots }).create(({ theme }) => ({
    "root": {
        "display": "inline-flex"
    },
    "dot": {
        "width": 5,
        "height": 5,
        "backgroundColor": "transparent",
        "borderRadius": "50%",
        "margin": theme.spacing(1),
        "animation": `${keyframes`
                0% { background-color: ${theme.colors.useCases.typography.textFocus}; }
                50%, 100% { background-color: transparent; }
            `} 1s infinite linear alternate`,
        "&:nth-of-type(1)": { animationDelay: "0s" },
        "&:nth-of-type(2)": { animationDelay: ".2s" },
        "&:nth-of-type(3)": { animationDelay: ".4s" }
    }
}));
