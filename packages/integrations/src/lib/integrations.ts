import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { ObjectId } from "mongodb";
import amqp from "amqplib"
import { validateSlackConfigPayload, validateSlackMsgPayload } from "@org/database";


const amqpServer = process.env.NODE_ENV === "production" ? process.env.RABBIT_MQ_SERVER : "amqp://localhost"

const app = new Hono().basePath("/integration")
const prisma = new PrismaClient()
const SLACK_SERVER_URI = "http://localhost:5000"

const main = async () => {
    const connection = await amqp.connect(amqpServer)
    const channel = await connection.createConfirmChannel()

    app.get("/slack/install/:workspaceId", async (c) => {
        const workspaceId = c.req.param("workspaceId")

        if (!ObjectId.isValid(workspaceId)) {
            return c.json({ message: "Invalid workspace Id" }, 400)
        }

        const [installation, integration] = await Promise.all([prisma.slackInstallation.findUnique({ where: { workspaceId } }), prisma.integration.findUnique({ where: { service: "slack", workspaceId } })
        ])

        if (installation) {
            return c.json({ message: "slack is already installed on this workspace" })
        }
        if (integration) {
            return c.json({ message: "slack is already installed on this workspace" })
        }
        const queue = "slack_installation"
        channel.assertQueue(queue, {
            durable: true
        })

        channel.sendToQueue(queue, Buffer.from(workspaceId), {}, (err) => {
            if (err) {
                return c.json({ message: "an error occured while installing slack to your workspace" })
            }
            return c.redirect(`${SLACK_SERVER_URI}/slack/install`)
        })

        return c.redirect(`${SLACK_SERVER_URI}/slack/install`)

    })


    app.post("/slack-configure", async (c) => {
        const body = await c.req.json()
        const { error, data } = validateSlackConfigPayload(body)
        if (error) {
            return c.json({ message: "invalid slack payload" }, 400)
        }


        const integration = await prisma.integration.findUnique({ where: { service: data.service, workspaceId: data.workspaceId } })
        if (!integration) {
            return c.json({ message: "integration for slack in workspace  not found" }, 404)
        }

        await prisma.integration.update({ where: { service: data.service, workspaceId: data.workspaceId }, data: { slackBotoken: data.token } })

        return c.json({ messages: "slack settings updated successfully" })
    })

    app.post("/slack-message", async (c) => {
        const req = await c.req.json()
        const { error, data } = validateSlackMsgPayload(req)
        if (error) {
            return c.json({ message: `Validation Error: ${error.errors[0].message}` }, 400)
        }

        const integration = await prisma.integration.findUnique({ where: { service: "slack", workspaceId: data.workspaceId } })
        if (!integration.slackBotoken) {
            return c.json({ message: "slack bot token not found, report to your workspace admin to your workspace admin" }, 404)
        }
        const msgPayload = {
            ...data,
            token: integration.slackBotoken
        }

        channel.sendToQueue("slack_message", Buffer.from(JSON.stringify(msgPayload)), {}, (err) => {
            if (err) {
                return c.json({ message: "an error occured while sending slack messages" })
            }



            return c.json({ message: "slack message sent successfully" })
        })

        return c.json({ message: "slack message sent successfully" })
    })



    app.get("/slack/channels/:workspaceId", async (c) => {
        const workspaceId = c.req.param("workspaceId")
        return c.redirect(`${SLACK_SERVER_URI}/slack/channels/${workspaceId}`, 301)
    })



    app.get("/command", async (c) => {
        return c.json([
            {
                service: "gmail",
                logo: "",
                commands: [
                    {
                        alias: "/send-email",
                        name: "send email",
                        link: ""
                    }
                ]
            },
            {
                service: "slack",
                logo: "",
                commands: [
                    {
                        alias: "/send-slack",
                        name: "send slack message",
                        link: "/slack-message"
                    }
                ]
            }
        ])
    })


    app.get("/", async (c) => {

        return c.json({
            message: "integration retrieved successfully", data: [
                {
                    service_name: "slack",
                    service_description: "slack is a collaboration platform",
                    link: "https://05e8-105-112-176-118.ngrok-free.app/slack/install"
                }, {
                    service_name: "github",
                    service_description: "git is a collaboration platform",
                    link: "https://05e8-105-112-176-118.ngrok-free.app/slack/install"
                },
            ]
        })
    })



    app.onError((err, c) => {
        if (err) {
            return c.json({ message: "error occured on the server", stack: process.env.NODE_ENV.includes("dev") ? err.stack : null })
        }
    })
    return app


}




export default main