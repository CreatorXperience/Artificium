import z from "zod"


const slackConfigure = z.object({
    token: z.string({ message: "property token is required" }),
    service: z.string({ message: "property service is required" }),
    workspaceId: z.string({ message: "property message is required" })
})

type TSlackPayload = Required<z.infer<typeof slackConfigure>>
const validateSlackConfigPayload = (payload: TSlackPayload) => {
    return slackConfigure.required().safeParse(payload)

}




const slackMsgSchema = z.object({
    workspaceId: z.string({ message: "property workspace Id is required" }),
    messageId: z.string({ message: "property messageId is required" }),
    text: z.string({ message: "property messageId is required" }),
    channel: z.string({ message: "property messageId is required" }),
})



type TSlackMsgPayload = Required<z.infer<typeof slackMsgSchema>>

const validateSlackMsgPayload = (payload: TSlackMsgPayload) => {
    return slackMsgSchema.required().safeParse(payload)

}


const slackMsgScheduleSchema = z.object({
    channel: z.string({ message: "property channel is required" }),
    text: z.string({ message: "property text is required" }),
    post_at: z.string({ message: "property post_at is required" }),
    workspaceId: z.string({ message: "property workspaceId is required" }),

})

type TSlackScheduleMessage = Required<z.infer<typeof slackMsgScheduleSchema>>


const validateSlackSchedule = (payload: TSlackScheduleMessage) => {
    return slackMsgScheduleSchema.required().safeParse(payload)
}

export { slackConfigure, validateSlackConfigPayload, TSlackPayload, validateSlackMsgPayload, TSlackScheduleMessage, validateSlackSchedule }