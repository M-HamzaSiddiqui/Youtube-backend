import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteImageFromCloudinary, deleteVideoFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user");
    }

    const videos = await Video.aggregate([
        {
            $match: {
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]

            }
        },
        {
            $sort: {
                [sortBy]: sortType === 'desc' ? -1 : 1
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                thumbnail: 1,
                title: 1,
                views: 1,
                owner: 1,
                createdAt: 1,
                duration: 1,
                videoFile: 1,
                description: 1
            }
        }
    ]);

    if (!videos?.length) {
        throw new ApiError(404, "No videos found");
    }

    res
        .status(200)
        .json(
            new ApiResponse(200, videos, "Videos retrieved successfully")
        );

});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video

    const userId = req.user._id;

    if (
        [title, description].some(field => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    let localVideoFilePath;
    if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) {
        localVideoFilePath = req.files.videoFile[0].path;
    }

    let localThumbnailPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        localThumbnailPath = req.files.thumbnail[0].path;
    }

    if (!(localVideoFilePath || localThumbnailPath)) {
        throw new ApiResponse(404, "Video and thumbnail are required");
    }

    const video = await uploadOnCloudinary(localVideoFilePath);
    const thumbnail = await uploadOnCloudinary(localThumbnailPath);

    const createdVideo = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title: title,
        description: description,
        duration: video.duration,
        owner: userId
    });

    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while publishing video");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, createdVideo, "Video published successfully")
        );

});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(400, "video id is required");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Enter a valid object id");
    }

    const video = await Video.findById(videoId);
    video.views += 1

    const viewUpdatedVideo = await video.save()

    if (!video) {
        throw new ApiError(404, "video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, viewUpdatedVideo, "video retrieved successfully")
        );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail

    if (!videoId) {
        throw new ApiError(400, "videoId is required");
    }

    const video = await Video.findById(new mongoose.Types.ObjectId(videoId));

    if (!video) {
        throw new ApiError(404, "Invalid videoId");
    }

    const { title, description } = req.body;
    const localThumbnailPath = req.file?.path;
    if (!(title && description && localThumbnailPath)) {
        throw new ApiError(400, "All fields are required");
    }

    const newThumbnail = await uploadOnCloudinary(localThumbnailPath);

    if (!newThumbnail) {
        throw new ApiError(500, "Something went wrong while uploading thumbnail");
    }

    const oldThumbnail = video.thumbnail;

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        $set: {
            thumbnail: newThumbnail.url,
            title: title,
            description: description
        }
    },
        {
            $new: true
        });

    const oldThumbnailPublicId = oldThumbnail.split('/').pop().split('.')[0];
    await deleteImageFromCloudinary(oldThumbnailPublicId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "Video details updated successfully")
        );


});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Enter a valid videoId");
    }

    const video = await Video.findByIdAndDelete(new mongoose.Types.ObjectId(videoId));



    if (!video) {
        throw new ApiError(400, "Video does not exist");
    }

    const videoPublicId = video.videoFile.split("/").pop().split(".")[0].trim();
    const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0].trim();

    if (!videoPublicId || !thumbnailPublicId) {
        throw new ApiError(500, "cannot get video and thumbnail public id's");
    }

    await deleteVideoFromCloudinary(videoPublicId);
    await deleteImageFromCloudinary(thumbnailPublicId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Video deleted successfully")
        );

});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video Id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;

    const updatedVideo = await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "publish status toggled successfully")
        );


});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};