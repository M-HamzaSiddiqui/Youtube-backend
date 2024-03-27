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

    const likedVideos = await Like.aggregate([
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
                as: "videoInfo"
            }
        },  
        {
            $project: {
                videoInfo: { $arrayElemAt: ['$videoInfo', 0] },
                _id: 0
            }
        },
    ]);

    if (!likedVideos?.length) {
        throw new ApiError(404, "No video found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideos, "Liked videos retrieved successfully")
        );

});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
};