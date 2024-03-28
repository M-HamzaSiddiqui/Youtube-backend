import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const likedVideo = await Like.findOne({ video: videoId, likedBy: req.user?._id });

    if (!likedVideo) {
        const newLikedVideo = await Like.create({
            video: new mongoose.Types.ObjectId(videoId),
            likedBy: req.user?._id
        });
        return res
            .status(200)
            .json(
                new ApiResponse(200, newLikedVideo, "Video liked successfully")
            );
    }

    await likedVideo.deleteOne();
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Video like removed successfully")
        );

});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    const likedComment = await Like.findOne({ comment: commentId, likedBy: req.user?._id });

    if (!likedComment) {
        const newLikedComment = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        });
        return res
            .status(200)
            .json(new ApiResponse(200, newLikedComment, "comment liked successfully"));
    }

    await likedComment.deleteOne();
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "comment like removed successfully")
        );


});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    const likedTweet = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    });

    if (!likedTweet) {

        const newLikedTweet = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        });

        if (!newLikedTweet) {
            throw new ApiError(500, "Unable to like the video");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, newLikedTweet, "Tweet liked successfully")
            );

    }

    await likedTweet.deleteOne();
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Tweet like removed successfully")
        );
}
);

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const {page = 1, limit = 10} = req.query

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const likedVideos = Like.aggregate([
        {
            $match: {
                likedBy: req.user?._id,
                video: { $exists: true }
            }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: "videoInfo",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            description: 1,
                            duration: 1,
                            videoFile: 1,
                            views: 1
                        }
                    }
                ]
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'likedBy',
                foreignField: '_id',
                as: 'ownerInfo',
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            fullname: 1,
                            _id: 0
                        }
                    }
                ]
            }
        },
        {
            $project: {
                videoInfo: { $arrayElemAt: ['$videoInfo', 0] },
                _id: 0,
                ownerInfo: 1,
                ownerInfo: {
                    $first: '$ownerInfo'
                }
            }
        },
    ]);

    const paginatedLikedVideos = await Like.aggregatePaginate(likedVideos, options)

    if(!paginatedLikedVideos.docs?.length){
        throw new ApiError(400, "no liked videos found || You might be giving wrong query parameters")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, paginatedLikedVideos.docs, "Liked videos retrieved successfully")
        );

});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
};