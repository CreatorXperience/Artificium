import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { ObjectId } from "mongodb";
import amqp from "amqplib"
import { authMiddleWare } from "@org/auth"
import { validateSlackConfigPayload, validateSlackMsgPayload, validateSlackSchedule } from "@org/database";
import { google } from "googleapis"


const amqpServer = process.env.NODE_ENV === "production" ? process.env.RABBIT_MQ_SERVER : "amqp://localhost"

const app = new Hono().basePath("/integration")
const prisma = new PrismaClient()
const SERVER_URIS = {
    slack: "http://localhost:5000",
    gmail: "http://localhost:4000"
}

const main = async () => {
    let channel: amqp.Channel
    try {
        const connection = await amqp.connect(amqpServer)
        channel = await connection.createChannel()
    }
    catch (e) {
        console.log(`❌ an error occured while connecting to rabbitmq server @${amqpServer} `)
    }

    const oauth2_client = new google.auth.OAuth2(process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI + "/google/services")



    return {
        getIntegrationApp: () => {
            app.get("/slack/install/:workspaceId", authMiddleWare, async (c) => {
                const workspaceId = c.req.param("workspaceId")

                if (!ObjectId.isValid(workspaceId)) {
                    return c.json({ message: "Invalid workspace Id" }, 400)
                }

                const [installation, integration] = await Promise.all([prisma.slackInstallation.findUnique({ where: { workspaceId } }), prisma.integration.findFirst({ where: { service: "slack", workspaceId } })
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

                channel.sendToQueue(queue, Buffer.from(workspaceId), { persistent: true })

                return c.redirect(`${SERVER_URIS.slack}/slack/install`)

            })

            app.post("/slack-configure", async (c) => {
                const body = await c.req.json()
                const { error, data } = validateSlackConfigPayload(body)
                if (error) {
                    return c.json({ message: "invalid slack payload" }, 400)
                }


                const integration = await prisma.integration.findFirst({ where: { service: data.service, workspaceId: data.workspaceId } })
                if (!integration) {
                    return c.json({ message: "integration for slack in workspace  not found" }, 404)
                }

                await prisma.integration.update({ where: { id: integration.id, service: data.service, workspaceId: data.workspaceId }, data: { slackBotoken: data.token } })

                return c.json({ messages: "slack settings updated successfully" })
            })

            app.post("/slack-message", async (c) => {
                const req = await c.req.json()
                const { error, data } = validateSlackMsgPayload(req)
                if (error) {
                    return c.json({ message: `Validation Error: ${error.errors[0].message}` }, 400)
                }

                const integration = await prisma.integration.findFirst({ where: { service: "slack", workspaceId: data.workspaceId } })
                if (!integration.slackBotoken) {
                    return c.json({ message: "slack bot token not found, report to your workspace admin to your workspace admin" }, 404)
                }
                const msgPayload = {
                    ...data,
                    messageId: data.messageId,
                    token: integration.slackBotoken
                }

                channel.sendToQueue("slack_message", Buffer.from(JSON.stringify(msgPayload)), { persistent: true })

                return c.json({ message: "slack message sent successfully" })
            })


            app.post("/slack/schedule", async (c) => {
                const req = await c.req.json()
                const { error, data } = validateSlackSchedule(req)
                if (error) {
                    return c.json({ message: `Validation Error: ${error.errors[0].message}` })
                }
                const q = "slack-schedule"
                channel.assertQueue(q, { durable: true })
                const content = Buffer.from(JSON.stringify(data))
                channel.sendToQueue(q, content, { persistent: true })
            })

            app.get("/slack/channels/:workspaceId", async (c) => {
                const workspaceId = c.req.param("workspaceId")
                return c.redirect(`${SERVER_URIS.slack}/slack/channels/${workspaceId}`, 301)
            })

            app.get("/app/gmail/oauth_url/:workspaceId", async (c) => {
                const { workspaceId } = c.req.param()
                if (!ObjectId.isValid(workspaceId)) {
                    return c.json({ message: "Invalid workspace ID" }, 400)
                }
                try {
                    const integration = await prisma.integration.findFirst({ where: { workspaceId, service: "gmail" } })
                    if (integration) {
                        if (integration.gmailRefreshToken && integration.gmailAccessToken && integration.gmailAccessTokenExpiryDate) {
                            if (integration.gmailAccessTokenExpiryDate - Date.now() < 5 * 60 * 1000) {
                                oauth2_client.setCredentials({ refresh_token: integration.gmailRefreshToken })
                                const token = await oauth2_client.getAccessToken()
                                await prisma.integration.update({ where: { id: integration.id, workspaceId, service: "gmail" }, data: { gmailAccessToken: token.token } })
                                return c.json({ message: "you've already integrated gmail into your workspace" })
                            }
                            return c.json({ message: "you've already integrated gmail into your workspace" })
                        }
                        return c.json({ message: "try again later" })
                    }

                    return c.redirect(`${SERVER_URIS.gmail}/app/gmail/oauth_url?workspaceId=${workspaceId}`)
                } catch (e) {
                    console.log(e)
                }
            })

            app.get("/commands", async (c) => {
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
                            link: `${SERVER_URIS.slack}/slack/install`
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
        },

        getRabbitMQChannel: () => {
            return channel
        }
    }

}




export default main