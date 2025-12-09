frappe.provide("erpnext.taxes_and_totals");

if (erpnext.taxes_and_totals) {

    erpnext.taxes_and_totals.prototype.get_current_tax_amount = function (item, tax, item_tax_map) {
		var tax_rate = this._get_tax_rate(tax, item_tax_map);
		var current_tax_amount = 0.0;

		// To set row_id by default as previous row.
		if(["On Previous Row Amount", "On Previous Row Total"].includes(tax.charge_type)) {
			if (tax.idx === 1) {
				frappe.throw(
					__("Cannot select charge type as 'On Previous Row Amount' or 'On Previous Row Total' for first row"));
			}
			if (!tax.row_id) {
				tax.row_id = tax.idx - 1;
			}
		}
		if(tax.charge_type == "Actual") {
			// distribute the tax amount proportionally to each item row
			var actual = flt(tax.tax_amount, precision("tax_amount", tax));
			current_tax_amount = this.frm.doc.net_total ?
				((item.net_amount / this.frm.doc.net_total) * actual) : 0.0;

		} else if(tax.charge_type == "On Net Total") {
			if (tax.included_in_print_rate){
				var net_amount = item.amount / (1 + tax_rate / 100.0)
				current_tax_amount = item.amount - net_amount
			}else {
				current_tax_amount = (tax_rate / 100.0) * item.net_amount;
			}
		} else if(tax.charge_type == "On Previous Row Amount") {
			current_tax_amount = (tax_rate / 100.0) *
				this.frm.doc["taxes"][cint(tax.row_id) - 1].tax_amount_for_current_item;

		} else if(tax.charge_type == "On Previous Row Total") {
			current_tax_amount = (tax_rate / 100.0) *
				this.frm.doc["taxes"][cint(tax.row_id) - 1].grand_total_for_current_item;
		} else if (tax.charge_type == "On Item Quantity") {
			current_tax_amount = tax_rate * item.qty;
		}

		if (!tax.dont_recompute_tax) {
			this.set_item_wise_tax(item, tax, tax_rate, current_tax_amount);
		}
		return flt(current_tax_amount, precision("tax_amount", tax))
	};


    erpnext.taxes_and_totals.prototype.set_item_wise_tax = function (item, tax, tax_rate, current_tax_amount) {
        // store tax breakup for each item
		let tax_detail = tax.item_wise_tax_detail;
		let key = item.item_code || item.item_name;

		if(typeof (tax_detail) == "string") {
			tax.item_wise_tax_detail = JSON.parse(tax.item_wise_tax_detail);
			tax_detail = tax.item_wise_tax_detail;
		}

		let _item_wise_tax_amount = current_tax_amount * this.frm.doc.conversion_rate;
		let item_wise_tax_amount = flt(_item_wise_tax_amount, precision("tax_amount"), tax)
		if (tax_detail && tax_detail[key])
			item_wise_tax_amount += flt(
				tax.item_wise_tax_detail[key][1], precision("tax_amount", tax)
			)

		tax_detail[key] = [tax_rate, flt(item_wise_tax_amount, precision("base_tax_amount", tax))];
    };
}
