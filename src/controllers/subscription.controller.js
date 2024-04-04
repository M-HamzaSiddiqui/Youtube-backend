
import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel Id")
    }

    const subscription = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    if(!subscription) {
        const newSubscription = await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        })

        if(!newSubscription) {
            throw new ApiError(500, "Unable to subscribe the channel at the moment.")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, newSubscription, "Channel Subscribed successfully")
        )
    }

    const unsubscribe = await subscription.deleteOne()

    return res
    .status(200)
    .json(
        new ApiResponse(200, unsubscribe, "Channel unsubscribed successfully")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
