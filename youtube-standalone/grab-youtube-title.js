const { Client } = require("youtubei");
const colors = require("colors");
const youtube = new Client();


/* Gets the Video Id from any youtube video URL, which can be in any of the 
 * following forms 
 * http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index
 * http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o
 * http://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0
 * http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s
 * http://www.youtube.com/embed/0zM3nApSvMg?rel=0
 * http://www.youtube.com/watch?v=0zM3nApSvMg
 * http://youtu.be/0zM3nApSvMg
 *
 * Adapted from https://stackoverflow.com/a/8260383/11704645
 * */
const getYoutubeVideoId = (url) => {
    // https://stackoverflow.com/a/8260383/11704645
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}

/* getYoutubeVideoInfo crawls the video information, and then collects only what we need.
 * This is useful, if we need to embed this in a web application, etc. */
const getYoutubeVideoInfo = async (id) => {
    const video = await youtube.getVideo(id);
    return {
        "id": video.id,
        "title": video.title,
        "description": video.description,
        "channel": video.channel.name,
        "channel-id": video.channel.id
    }
    
}

const run = async () => {
    // for each item in the system argv, we need to process
    // the links
    process.argv.slice(2).forEach(async function(item, index) {
        const videoId = getYoutubeVideoId(item);
        const videoInfo = await getYoutubeVideoInfo(videoId);
        console.log(`title: ${videoInfo["title"].green}
channel: ${videoInfo["channel"].green}
channel-id: ${videoInfo["channel-id"].green}
description: ${videoInfo["description"].yellow}

`);
    });
};

run();
