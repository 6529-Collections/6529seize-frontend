import UserPageIdentityStatements from "./UserPageIdentityStatements";
import UserPageIdentityHeader from "./header/UserPageIdentityHeader";

export default function UserPageIdentity() {
  return (
    <div className="tailwind-scope">
      <UserPageIdentityHeader />
      <UserPageIdentityStatements />
    </div>
  );
}
