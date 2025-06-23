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
    channel: z.string({ message: "property channel is required" }),
    text: z.string({ message: "property text is required" }),
    workspaceId: z.string({ message: "property workspace Id is required" })
})

type TSlackMsgPayload = Required<z.infer<typeof slackMsgSchema>>

const validateSlackMsgPayload = (payload: TSlackMsgPayload) => {
    return slackMsgSchema.required().safeParse(payload)

}





export { slackConfigure, validateSlackConfigPayload, TSlackPayload, validateSlackMsgPayload }