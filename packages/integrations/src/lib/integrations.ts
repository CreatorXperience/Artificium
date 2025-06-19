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
        const slackInstallation = await prisma.slackInstallation.findUnique({ where: { workspaceId } })
        if (slackInstallation) {
            return c.json({ message: "slack is already installed on this workspace" })
        }
        const queue = "slack_installation"
        channel.assertQueue(queue, {
            durable: false
        })

        channel.sendToQueue(queue, Buffer.from(workspaceId))
        console.log("[artificium-360] sent %s", workspaceId)

        return c.redirect("https://53c1-105-112-26-102.ngrok-free.app/slack/install")

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


    return app


}




export default main