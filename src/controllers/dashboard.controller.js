
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const channelId = req.user?._id;

    const totalVideos = await Video.countDocuments({
        owner: channelId
    });

    console.log(totalVideos, "\n");

    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: channelId,
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views"
                }
            }
        },
        {
            $project: {
                totalViews: 1,
                _id: 0
            }
        }
    ]);

    console.log(totalViews, "\n");

    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    });

    console.log(totalSubscribers, "\n");

    const totalLikes = await Video.aggregate([
        {
            $match: {
                owner: channelId
            }
        },
        {
            $lookup: {
                from: "likes",
                foreignField: "video",
                localField: "_id",
                as: "likes"
            }
        },
        {
            $count: "likes"
        }
    ]);

    console.log(totalLikes, "\n");

    return res.json(new ApiResponse(200, {
        totalVideos,
        totalViews: totalViews[0].totalViews,
        totalSubscribers,
        totalLikes: totalLikes[0].likes
    }, "success"));

});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const channelId = req.user?._id;
    const { page = 1, limit = 2 } = req.query;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id");
    }

    const pipeline = [
        {
            $match: {
                owner: channelId
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                _id: 1,
                videofile: 1,
                thumbnail: 1,
                title: 1,
                duration: 1,
                views: 1,
                owner: 1
            }
        }
    ];

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const videos = Video.aggregate(pipeline);

    const paginatedVideos = await Video.aggregatePaginate(videos, options);

    if (!paginatedVideos.docs?.length) {
        return res
            .status(200)
            .json(new ApiResponse(200, null, "no video found"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, paginatedVideos.docs, "Videos retrieved successfully")
        );

});

export {
    getChannelStats,
    getChannelVideos
};