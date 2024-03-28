import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid videoId");
    }

    console.log(videoId);

    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
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
                            username: 1,
                            avatar: 1,
                            fullname: 1
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
                content: 1,
                owner: 1,
                _id: 1
            }
        }
    ];

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const comments = Comment.aggregate(pipeline);
    console.log(comments);

    const paginatedComments = await Comment.aggregatePaginate(comments, options);


    return res
        .status(200)
        .json(
            new ApiResponse(200, paginatedComments.docs, "comments retrieved successfully")
        );


});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const { videoId } = req.params;
    const { content } = req.body;
    console.log(content);

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    if (!content) {
        throw new ApiError(400, "Comment can't be empty");
    }

    const comment = await Comment.create({
        content,
        video: new mongoose.Types.ObjectId(videoId),
        owner: req.user?._id
    });

    if (!comment) {
        throw new ApiError(500, "Unable to add comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "Comment added successfully")
        );

});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    if (!content) {
        throw new ApiError(400, "comment can't be empty");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            returnDocument: 'after'
        }
    );

    if (!updateComment) {
        throw new ApiError(500, "Couldn't update the comment at the moment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        );

});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(500, "Cannot delete the comment at the moment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedComment, "Comment deleted successfully")
        );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};