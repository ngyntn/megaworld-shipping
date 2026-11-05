"use client";
import { ModuleHeader } from "@/features/operations/components/shared";
import { ProfileSettings, PasswordSettings } from "./profile-settings";
import { ContactSettings, PriceSettings } from "./contact-settings";
import type { AccountData } from "@/features/operations/types";
export function SettingsView({ account }: { account: AccountData }) {
  return (
    <>
      <ModuleHeader name={account.name} />
      <div className="op-content">
        <div className="op-title">
          <div>
            <h1>Tài khoản & cài đặt</h1>
            <p>
              Thông tin tài khoản của bạn và thông tin liên hệ hiển thị cho
              khách
            </p>
          </div>
        </div>
        <div className="op-columns">
          <div className="settings-left">
            <ProfileSettings account={account} />
            <PasswordSettings />
          </div>
          <div className="settings-right">
            <ContactSettings storefront={account.storefront} />
            <PriceSettings account={account} />
          </div>
        </div>
      </div>
    </>
  );
}
