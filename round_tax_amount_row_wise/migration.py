from frappe.installer import update_site_config


def after_migrate():
	update_site_config("original_doctype_class", None)
	update_site_config("override_doctype_class", None)
