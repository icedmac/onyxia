import { css } from "@emotion/css";
import { getStoryFactory, createMockRoute } from "stories/getStory";
import { sectionName } from "../sectionName";
import MyFiles, { type Props } from "ui/pages/myFiles/MyFiles";
import { symToStr } from "tsafe/symToStr";

type StoryProps = {
    width: number;
    height: number;
};

function Component(
    props: Omit<Props, "className" | "route" | "splashScreen"> & StoryProps
) {
    const { width, height } = props;

    return (
        <MyFiles
            route={createMockRoute("myFiles", {})}
            className={css({
                width,
                height
            })}
        />
    );
}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "doNeedCore": true,
    "wrappedComponent": { [symToStr({ MyFiles })]: Component }
});

export default {
    ...meta,
    "argTypes": {
        ...meta.argTypes,
        "width": {
            "control": {
                "type": "range",
                "min": 200,
                "max": 1920
            }
        },
        "height": {
            "control": {
                "type": "range",
                "min": 200,
                "max": 1080
            }
        }
    }
};

export const View1 = getStory({
    "width": 1400,
    "height": 1100
});
