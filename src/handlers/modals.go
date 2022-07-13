package handlers

import (
	"github.com/bwmarrin/discordgo"
	"github.com/jerskisnow/Artemis-Bot/src/commands"
)

func LinkModals(s *discordgo.Session, i *discordgo.InteractionCreate) {
	data := i.ModalSubmitData()

	switch data.CustomID {
	case "modals_notes":
		commands.NotesModal(s, i)
	case "modals_suggestion":
		commands.SuggestionModal(s, i)
	case "modals_report":
		commands.ReportModal(s, i)

	// Configuration part
	case "modals_config_auth_staffrole":
		commands.ConfigAuthStaffroleModal(s, i)
	}
}
