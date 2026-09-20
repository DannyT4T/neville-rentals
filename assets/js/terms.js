/* Neville Rentals & Transportation — the agreement's terms.

   Built from the live contract so the printed clauses state this rental's
   actual deposit, insurance fee, dates and inspection schedule rather than
   generic placeholders. One source of truth: the builder previews the same
   text the signed document carries. */
(function (root) {
  'use strict';

  var U = root.NRT.util;

  function clauses(c, co, veh) {
    var t = c.totals;
    var deposit = U.money(t.deposit);
    var interval = co.inspectionIntervalDays || 30;
    var vehName = veh ? (veh.year + ' ' + veh.make + ' ' + veh.model) : 'the Vehicle';
    var list = [];

    list.push({
      title: 'Rental period',
      text: 'The Renter takes possession of ' + vehName + ' on ' + U.fmtDate(c.startDate, 'long') +
        ' and shall return it to ' + co.name + ' at ' + co.address + ' on or before ' +
        U.fmtDate(c.endDate, 'long') + ', a term of ' + t.days + ' day' + (t.days === 1 ? '' : 's') +
        '. Any extension must be agreed in writing before the return date and is billed at the rates set out in this agreement.'
    });

    list.push({
      title: 'Driver eligibility',
      text: 'The Renter certifies that they are at least ' + (co.minimumAge || 21) +
        ' years of age, hold a valid, unexpired driver license, and are the only person authorized to operate the Vehicle unless an additional driver is named in writing on this agreement. Permitting an unauthorized person to drive is a material breach of this agreement.'
    });

    list.push({
      key: true,
      title: 'Tolls',
      text: 'The Renter is responsible for every toll, SunPass charge and toll-by-plate invoice incurred while the Vehicle is in the Renter’s possession, together with any administrative fee assessed by the tolling authority. ' +
        'Toll charges received by ' + co.name + ' are itemized at check-in and deducted from the security deposit. ' +
        'Toll invoices that arrive after the deposit has been settled remain the Renter’s obligation and are payable within 10 days of notice.'
    });

    list.push({
      key: true,
      title: 'Security deposit',
      text: 'A refundable security deposit of ' + deposit + ' is collected at signing. ' +
        'At check-in the deposit is applied, in order, against: outstanding tolls, fuel shortfall, cleaning, new damage, late-return charges, and any unpaid rental balance. ' +
        'The remaining balance is returned to the Renter within 7 business days of the Vehicle’s return, accompanied by the itemized settlement printed on this contract. ' +
        'If deductions exceed ' + deposit + ', the difference is due from the Renter on demand.'
    });

    if (c.insurance && c.insurance.type === 'company') {
      list.push({
        title: 'Insurance — provided by ' + co.name,
        text: 'The Renter has elected coverage supplied by ' + co.name + ' at ' + U.money(c.insurance.dailyFee) +
          ' per day (' + U.money(t.insurance) + ' for this term), billed at signing. ' +
          'This coverage is subject to the policy’s deductible, exclusions and limits, and does not cover damage arising from prohibited use under Clause 10 below.'
      });
    } else {
      list.push({
        title: 'Insurance — self-insured',
        text: 'The Renter has elected to provide their own coverage and warrants that the Vehicle is covered for liability, collision and comprehensive loss for the full rental term under policy ' +
          ((c.insurance && c.insurance.policyNo) ? c.insurance.policyNo : '__________') +
          ' issued by ' + ((c.insurance && c.insurance.provider) ? c.insurance.provider : '__________') + '. ' +
          'A current certificate or declarations page naming the Vehicle must be on file with ' + co.name +
          ' before keys are released. The Renter remains liable for any loss their policy declines or does not reach.'
      });
    }

    list.push({
      title: 'Fuel',
      text: 'The Vehicle is released with the fuel level recorded in the Vehicle Condition article of this contract and must be returned at that same level. ' +
        'A shortfall is refueled by ' + co.name + ' at cost plus a $25 service charge and deducted from the security deposit.'
    });

    list.push({
      title: 'Condition and damage',
      text: 'The condition diagram on this contract records every mark present when the Vehicle was released, and both parties have reviewed it. ' +
        'Damage found at check-in that is not shown on that diagram is presumed to have occurred during the rental term and is the Renter’s responsibility, up to the repair cost or the insurance deductible, whichever applies.'
    });

    list.push({
      key: t.monthlyInspection,
      title: 'Monthly vehicle inspection',
      text: 'For any rental exceeding ' + interval + ' days, the Renter shall present the Vehicle to ' + co.name +
        ' for inspection every ' + interval + ' days during the term, at a time arranged with the office. ' +
        (t.monthlyInspection
          ? 'This rental runs ' + t.days + ' days and therefore requires ' + t.inspectionsDue +
            ' inspection' + (t.inspectionsDue === 1 ? '' : 's') + ', the first on or about ' +
            U.fmtDate(U.addDays(c.startDate, interval), 'long') + '. '
          : 'This rental does not exceed ' + interval + ' days and no interim inspection is scheduled. ') +
        'Failure to present the Vehicle for a required inspection permits ' + co.name + ' to terminate this agreement and recover the Vehicle.'
    });

    list.push({
      title: 'Mileage and territory',
      text: 'Mileage is unlimited within the State of Florida. ' +
        'Operation outside Florida requires prior written consent from ' + co.name + '. ' +
        'The Vehicle may not be taken outside the continental United States, and may not be carried by ferry or barge to any island not reachable by highway.'
    });

    list.push({
      title: 'Prohibited use',
      text: 'The Vehicle shall not be used: by any driver not named in this agreement; to carry passengers or property for hire, including rideshare and delivery platforms, without written consent; ' +
        'to push or tow anything; in any race or speed contest; off paved roads; while the driver is under the influence of alcohol, a controlled substance or any impairing medication; ' +
        'or in the commission of any crime. Prohibited use voids all coverage under this agreement and makes the Renter liable for the full value of any loss.'
    });

    list.push({
      title: 'Traffic and parking violations',
      text: 'Every summons, camera violation, parking ticket and towing or storage charge issued against the Vehicle during the rental term is the Renter’s responsibility, plus a $25 administrative fee per notice for processing and transfer of liability.'
    });

    list.push({
      title: 'Late return',
      text: 'The Vehicle is due by 6:00 PM on the return date. A return more than two hours late is billed at the daily rate of ' +
        U.money(c.dailyRate) + ' for each additional day begun. A Vehicle more than 48 hours overdue without contact may be reported as unauthorized use and recovered.'
    });

    list.push({
      title: 'Breakdown and maintenance',
      text: 'The Renter shall notify ' + co.name + ' at ' + co.phone +
        ' immediately of any mechanical fault, warning light, collision or theft. The Renter shall not authorize repairs without consent. ' +
        'Routine maintenance during the term is arranged by ' + co.name + '; damage from continuing to drive a Vehicle after a warning is displayed is the Renter’s responsibility.'
    });

    list.push({
      title: 'Default and repossession',
      text: 'If the Renter breaches any term of this agreement, ' + co.name +
        ' may terminate the rental and take possession of the Vehicle wherever found, without further notice, and recover the costs of doing so from the security deposit and from the Renter.'
    });

    list.push({
      title: 'Entire agreement; governing law',
      text: 'This document is the entire agreement between the parties and supersedes any prior understanding. ' +
        'No change is binding unless made in writing and signed by both parties. This agreement is governed by the laws of the State of Florida, and any action arising from it shall be brought in Miami-Dade County.'
    });

    return list;
  }

  function acknowledgements(c, co) {
    var t = c.totals;
    var acks = [
      { id: 'ack_terms', text: 'I have read and agree to all articles of this rental agreement.' },
      { id: 'ack_tolls', text: 'I understand that tolls incurred during this rental are deducted from my ' +
          U.money(t.deposit) + ' security deposit, and that the balance is returned to me after check-in.' },
      { id: 'ack_age', text: 'I certify that I am ' + (co.minimumAge || 21) +
          ' or older and hold a valid driver license.' },
      { id: 'ack_condition', text: 'I have inspected the vehicle and agree the fuel level and damage diagram above record its condition at pickup.' }
    ];
    if (t.monthlyInspection) {
      acks.push({ id: 'ack_inspect', text: 'This rental exceeds ' + (co.inspectionIntervalDays || 30) +
        ' days. I agree to present the vehicle for inspection every ' + (co.inspectionIntervalDays || 30) + ' days.' });
    }
    if (c.insurance && c.insurance.type === 'self') {
      acks.push({ id: 'ack_policy', text: 'I am self-insured and have supplied a current policy declarations page covering this vehicle for the full term.' });
    }
    return acks;
  }

  root.NRT.terms = { clauses: clauses, acknowledgements: acknowledgements };
})(window);
