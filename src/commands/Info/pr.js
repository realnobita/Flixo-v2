const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const NoPrefixSchema = require("../../models/NoPrefixSchema.js");
const moment = require("moment"); // For formatting dates

// 👇 Support Server Guild ID
const BADGE_GUILD_ID = "1371496371147902986"; // Replace with your actual Guild ID

const badgeMap = {
  "1408368580851929101": { emoji: "<:dev:1419505198627426425>", label: "Ŋ Ɔ Ɓ I T A ‹/›" },
  "1408368580851929101": { emoji: "<:developer:1420997999206863002>", label: "Developer" },
  "1408360145460924498": { emoji: "<:owner:1419505518300364885>", label: "Owner" },
  "1408360165014765649": { emoji: "<:co_owner:1419505473886883902>", label: "Co Owner" },
  "1418333819752157294": { emoji: "<:head_executive:1418453365838446674>", label: "Head Executive" },
  "1418333819009892363": { emoji: "<:senior_executive:1418453379872460852>", label: "Senior Executive" },
  "1418333818305384591": { emoji: "<:executive:1418453373476409344>", label: "Executive" },
  "1418331807492866129": { emoji: "<:head_manager:1420975756699242507>", label: "Head Manager" },
  "1418328917298778204": { emoji: "<:senior_manager:1420975994755612712>", label: "Senior Manager" },
  "1408361045352906793": { emoji: "<:Manager:1419505751365386311>", label: "Manager" },
  "1418328907219730622": { emoji: "<:head_admin:1418455419382399047>", label: "Head Admin" },
  "1418328908146933850": { emoji: "<:senior_admin:1420974416287895575>", label: "Senior Admin" },
  "1408360165786386552": { emoji: "<:admin:1420974320477409330>", label: "Admin" },
  "1418333119735402617": { emoji: "<:Reviewer:1418452861783642173>", label: "Reviewer" },
  "1418328915914653726": { emoji: "<:head_mod:1420972878286815272>", label: "Head Moderator" },
  "1418328916602519592": { emoji: "<:senior_mod:1420972838608834570>", label: "Senior Moderator" },
  "1408360622315278426": { emoji: "<:moderator:1420972627945717854>", label: "Moderator" },
  "1408360622940225689": { emoji: "<:Trial_Mod:1419504376229134357>", label: "Trial Moderator" },
  "1418332431538192495": { emoji: "<:head_staff:1419504325297967185>", label: "Junior Staff" },
  "1418332432461205584": { emoji: "<:senior_staff:1419504234885283913>", label: "Senior Staff" },
  "1408360623439478855": { emoji: "<:staff:1419504446404165702>", label: "Staff" },
  "1408361435809058846": { emoji: "<:BigServerOwner:1420950663323582605>", label: "Big Server Owner" },
  "1408360627927384094": { emoji: "<:friend:1420950183394410557>", label: "Developer's Friend" },
  "1383073624902209607": { emoji: "<:partner:1420949760080085044>", label: "Server Partner" },
  "1388178874667503877": { emoji: "<:Bughunter2:1341063128234070106>", label: "Bug Hunter" },
  "1408361031201198090": { emoji: "<:supporter:1420948929469747202>", label: "Supporter" },
  "1408361311167057990": { emoji: "<:Listerner:1420948140093083752>", label: "Music Listener" },
};

module.exports = {
  name: "profile",
  aliases: ["badges","pr"],
  description: "Displays a user's profile with global badges and no-prefix status",
  category: "Info",
  cooldown: 5,

  run: async (client, message, args) => {
    const targetUser = message.mentions.users.first() || message.author;

    // Fetch badge guild and member
    const badgeGuild = client.guilds.cache.get(BADGE_GUILD_ID);
    if (!badgeGuild) {
      return message.reply({
        content: "❌ The support server could not be found. Please contact the bot owner."
      });
    }

    let member;
    try {
      member = await badgeGuild.members.fetch(targetUser.id);
    } catch {
      member = null;
    }

    // Check badges
    let userBadges = [];
    let allBadges = "🌟 You don't have any badges yet! Join our support server to earn some!";

    if (member) {
      const badgeOrder = Object.keys(badgeMap);
      userBadges = badgeOrder
        .filter(roleId => member.roles.cache.has(roleId))
        .map(roleId => `${badgeMap[roleId].emoji} **${badgeMap[roleId].label}**`);

      if (userBadges.length > 0) {
        allBadges = userBadges.join("\n");
      }
    }

    // Check no-prefix status
    let noPrefixStatus = "No active no-prefix status.";
    try {
      const noPrefixData = await NoPrefixSchema.findOne({ userId: targetUser.id });
      if (noPrefixData) {
        if (noPrefixData.isPermanent) {
          noPrefixStatus = "**Permanent No-Prefix**";
        } else if (noPrefixData.expirationDate) {
          const expiration = moment(noPrefixData.expirationDate).format("MMMM Do YYYY, h:mm A");
          const daysLeft = moment(noPrefixData.expirationDate).diff(moment(), "days");
          noPrefixStatus = `**No-Prefix Active** (Expires: ${expiration}, ${daysLeft} days left)`;
        }
      }
    } catch (error) {
      console.error("Error fetching no-prefix data:", error);
      noPrefixStatus = "⚠️ Error fetching no-prefix status.";
    }

    // Create enhanced embed
    const embed = new EmbedBuilder()
      .setColor(client.color || "#00FF7F") // Fallback to a cool neon green
      .setAuthor({
        name: `${targetUser.username}'s Profile`,
        iconURL: targetUser.displayAvatarURL({ dynamic: true, size: 256 })
      })
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
      .setDescription(
        `**User**: ${targetUser.tag}\n` +
        `**ID**: \`${targetUser.id}\`\n` +
        `**Account Created**: ${moment(targetUser.createdAt).format("MMMM Do YYYY")}`
      )
      .addFields(
        {
          name: `<a:badges:1341064734572548147> Badges [${userBadges.length}]`,
          value: allBadges,
          inline: true
        },
        {
          name: "No-Prefix Status",
          value: noPrefixStatus,
          inline: true
        }
      )
      .setImage("https://cdn.discordapp.com/attachments/1371496371147902986/1298378273644544041/profile_banner.png") // Replace with your custom banner URL
      .setFooter({
        text: `Requested by ${message.author.username} | Powered by ${client.user.username}`,
        iconURL: client.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    // Create action row with buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Join Support Server")
        .setStyle(ButtonStyle.Link)
        .setEmoji("<a:supporter:1341062737727459411>")
        .setURL("https://discord.gg/G4Uc7mwfwM"),
      new ButtonBuilder()
        .setLabel("Vote for Us")
        .setStyle(ButtonStyle.Link)
        .setEmoji("<:discord:1395682373768581215>")
        .setURL("https://discord.ly/flixo")
    );

    return message.reply({ embeds: [embed], components: [row] });
  },
};