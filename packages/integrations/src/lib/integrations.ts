import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { ObjectId } from "mongodb";
import amqp from "amqplib"


const amqpServer = process.env.NODE_ENV === "production" ? process.env.RABBIT_MQ_SERVER : "amqp://localhost"

const app = new Hono().basePath("/integration")
const prisma = new PrismaClient()


const main = async () => {
    const connection = await amqp.connect(amqpServer)
    const channel = await connection.createChannel()

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

        channel.sendToQueue(queue, Buffer.from(workspaceId))
        console.log("[artificium-360] sent %s", workspaceId)

        return c.redirect("https://d22a-105-112-181-42.ngrok-free.app/slack/install")

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
                        link: ""
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