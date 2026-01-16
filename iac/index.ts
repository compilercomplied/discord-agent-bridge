import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

// TODO configuration loop
const discordToken = config.requireSecret("APP_DISCORD_TOKEN");
const orchestratorURL = config.requireSecret("APP_AGENT_ORCHESTRATOR_URL");
const clientID = config.require("APP_DISCORD_CLIENT_ID");
const dockerImage = config.get("DOCKER_IMAGE") || "ghcr.io/gdario/discord-agent-bridge:latest";

const appNamespace = "public-facing";
const appName = "discord-agent-bridge";
const appLabels = { app: appName };

const ns = new k8s.core.v1.Namespace(
  appNamespace,
  { metadata: { name: appNamespace }, }
);

const deployment = new k8s.apps.v1.Deployment(appName, {
  metadata: {
    namespace: ns.metadata.name,
  },
  spec: {
    selector: { matchLabels: appLabels },
    replicas: 1,
    template: {
      metadata: { labels: appLabels },
      spec: {
        containers: [{
          name: appName,
          image: dockerImage,
          env: [
            { name: "APP_AGENT_ORCHESTRATOR_URL", value: orchestratorURL },
            { name: "APP_DISCORD_CLIENT_ID", value: clientID },
            { name: "APP_DISCORD_TOKEN", value: discordToken },
          ],
          resources: {
            requests: { memory: "256Mi", cpu: "100m" }
          }
        }],
      },
    },
  },
});

export const namespaceName = ns.metadata.name;
export const name = deployment.metadata.name;
