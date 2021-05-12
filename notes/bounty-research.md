
☑ Experiment with ObservableHQ graphs ⇒ https://observablehq.com/@artemgr/rusty-gun-a-story  
☑ Make a larger map in `rusty-gun-a-story`  
→ ☑ Narrow down to major goals ⇒ Bottom-up development; modularity; transfer of knowledge in OSS ⇒ Also the problem we've seen with maps is complexity. The reason why the maps are seldom used in practice might be in the overhead of encoding and maintaining the various relationships  
[![complex map](https://i.imgur.com/DYWmkMls.jpg)](https://i.imgur.com/DYWmkMl.jpg)  
☑ List contributors in Change Log, cf. https://github.com/Geal/nom/blob/master/CHANGELOG.md

Testable tasks/projects/requests  
→ ☑ Explore https://deepspec.org/main ? ⇒ Interesting concept, but no one we know is using it, most people either never heard of Coq or are not asking the questions to which the Coq might be an answer (fitness function, acceptance testing); plus the learning curve seems to be steep, too much overhead to be used in the wild  
→ ☒ Look deeper at [Model-Based Testing of Networked Applications](https://arxiv.org/pdf/2102.00378.pdf) ? ⇒ We're not quite there yet in terms of resources

Research informal freelancer networks  
→ ☑ Make a template and/or docu for freelance jobs ⇒ https://observablehq.com/@artemgr/forward-running-freelance  
→ → ☑ Freelance.com moderation might dislike external links. Experiment with adding the link *after* the initial moderation?  
→ ☑ https://www.bitfortip.com/questions/1055 looking for precedents  
→ ☑ Experiment with fiverr ⇒ Learned that developers would often prefer to get proposals, instead of manually filtering through the jobs (NB: Freelancer also [has this](https://www.freelancer.com/search/users/)). Also the job matching ritual is suboptimal (see the chat with speedwares)  
⇒ [Why is Fiverr bad?](https://www.quora.com/Why-is-Fiverr-bad/answers/116949930), imposes a certain timeframe  
⇒ [outsourcing](https://forum.fiverr.com/t/is-outsourcing-allowed-on-fiverr-for-sellers/353768)  
⇒ Tip size is limited; but freelancers can edit the price  
⇒ Good chance is that most Offers are either automated or ran by low key gatekeepers, tasked with eliciting the “details”; when Request contains a question that wasn't answered in the Offer then opening a chat and repeating the question tends to produce no answer as well, though there might be exceptions  
→ ☑ Experiment with PeoplePerHour ⇒ Moderation says “The content of the Project you have posted is very descriptive, and the freelancers might not completely understand your requirements”: 1) sounds like endorsement of the Waterfall Model; 2) prevents from gauging the quality and proactiveness of the bids  
→ ☒ Experiment with gun.io interviews ⇒ The [Why you should join](https://i.imgur.com/OVCFBc5.png) step rubs me in a wrong way currently: sounds like a typical “oversell and underdeliver”, where a corporation would praise themselves and the dev would expect something good, until the “contrast effect” kicks in

Research on what makes a good freelance client  
→ ☑ https://www.bitfortip.com/questions/1056 looking for sources ⇒ Moved to [tabs](https://github.com/ArtemGr/bounty/tree/main/data/firefox)

Experiment with bottom-up (leader-leader) bounty-driven development  
→ ☑ Phase one, the Telegram group ⇒ Positive feedback, small traction  
→ ☑ Daily top up ⇒ Added to TasksDb  
→ ☒ List of known bounty kinds ⇒ I suspect this is “disruptive to routine tasks”, should focus on task creation, selection and acquisition first, and then return to the *bonus lottery* later on  
→ ☑ “take a break” experiment ⇒ https://github.com/ArtemGr/bounty/issues/5; https://www.freelancer.com/contest/take-a-break-go-out-and-make-a-picture-1873762/entries; https://www.upwork.com/ab/applicants/1347469384349327360/job-details; https://www.freelancer.com/contest/twitter-tag-for-fun-and-social-contests-1880774/details  
→ ☑ Start Twitter contests

☑ RLS bountry experiment (https://www.reddit.com/r/rust/comments/kur3vn/rls_bounty_583_to_fix_stuck_on_indexing/) ⇒ Despite the bad publicity it *looks* like the bug was fixed soon after we've placed the bounty, even though nobody has claimed it or followed up in the issue

☑ Consider the competition format,  
cf. https://vk.com/durovschallenge, https://t.me/contests_ru, https://t.me/contest, https://codeforces.com/ ⇒ There is a low-hanging fruit of implementing competition-like benchmarks (high scores, halls of fame) over the open job database, announcing them on Twitter, displaying in UI. That is, instead of organizing a separate competition we might be able to reuse and improve the bounty and freelance benchmarks, perhaps also the quality and security reviews. That way it isn't just about competition but we can benchmark also, say, teamwork  
⇒ On the other hand, contests might be a way to find bottom-up ideas. Here's a little experiment: https://www.freelancer.com/contest/gource-tool-1885809/details  
⇒ So when we “Post a Project” of Freelancer or “Post a Request” on Fiverr, it should be possible to tailor the Project/Request into a prompt for bottom-up/proactive suggestions  
☑ Experiment with https://www.bitfortip.com/ ⇒ Useful for gettins a better sense of average, of basic knowledge. Anything past the basics - we might want to elaborate or synchronize on ⇒ Good input from https://www.bitfortip.com/questions/1039

☑ Experiment with Qualitative Interviewing  
→ ☑ Create a separate MarkDown space  
→ ☑ Transcript the first set of interviews  
→ ☑ Second round, self-wishing and the Happy New Year  
→ ☑ Assemble a list of people whom we can ask about GUN  
→ ☑ Interview with Shawkat  
→ ☑ Interview with Mario  
→ ☑ Interview with MV  
→ ☑ OSS questions (with AI), mv-ag-questions  
☑ Consider creating a Telegram channel in order to allow for convenient video messaging  
→ ☑ See if Telescope is supported in Telegram groups  
→ ☑ Telescope promotes good video ecology: short videos are easier to discard and retry, easier to watch and to index, allow for chunked communication and dialogue. Question is, can we transfer this somehow to Discord? A bot that would copy the Telegram Telescope videos to Discord? And should we bother? ⇒ Discord can embed short (under 8 MB) libx264 mp4 videos, which seems good enough, though maybe we should collect the ways to record these  
☑ Figure how/if the Qualitative Interviewing can factor into the bounty-driven development  
→ ☑ File the idea of embedded QI  
→ ☑ Consider the format of public podcasts ⇒ Known downsides: time synchronization, TMI, hard to get different opinions from different people, postprocessing not included  
→ ☑ Experiment with video attachments on GitHub

# benchmarks

Yurii has mentioned a “distance” benchmark. Too little distance might result in rot and stagnation, lack of self-expansion. Too much distance might result in ridicule and negative affect. cf.

    “when confronted by a truly novel stimulus, the initial reactions are defensive and protective .. Only after information accumulates over time suggesting a lack of threat do more traditional “orienting” behaviors of approach and exploration ensue”

The culture tags [proposed by andrew-ld](https://github.com/ArtemGr/bounty/issues/6) might be related to distance

Distance is but one of the sources which factor into defensive and appetitive motivational systems. What we really want to measure is appetitive/defensive emotion. But people would often and automatically hide their emotions ([“эффект кафтана”](https://youtu.be/zypuneus6b0)) so we might need uncontaminated markers… like distance

Per [Pomodoro Video Freelance](https://observablehq.com/@artemgr/pomodoro-freelance) one obvious benchmark is the price of the video. We think that both parties should participate in the valuation, a freelancer giving their estimate and a sponsor obviously spending their money on the actual bid. One option might be to get the prices from both parties first and only then to reveal them. Given that money is often a source of motivation and also of valuation, this might amplify the strength of the feedback signal

Another benchmark that came about around the [Pomodoro Video Freelance](https://observablehq.com/@artemgr/pomodoro-freelance) is the “win-win”. Was the work interesting, was it educational, did it constitute a “win” for the freelancer? We want to “[Build projects around motivated individuals](https://www.agilealliance.org/agile101/12-principles-behind-the-agile-manifesto/)” and if the freelancer is thinking that they've “lost” by working on a task then it's a good time and opportunity to investigate. Similarly, it might be important to give the freelancer an idea on whether they work has actually helped the sponsor. The benchmark itself should likely be framed in positive, as a number of percents (“on a scale of 0 to 100, how much working on this was a win?”)
