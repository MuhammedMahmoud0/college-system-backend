--
-- PostgreSQL database dump
--

\restrict fqDS8HdSE6TR0EmCDfhI4x4F30Z7Gb8ro8UdNUagSog85Pgi89evhgn5ee5DgaL

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: audience_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.audience_type AS ENUM (
    'All',
    'Students',
    'Faculty'
);


ALTER TYPE public.audience_type OWNER TO postgres;

--
-- Name: enrollment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enrollment_status AS ENUM (
    'enrolled',
    'dropped',
    'completed'
);


ALTER TYPE public.enrollment_status OWNER TO postgres;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'new_grade',
    'exam_deadline',
    'community_activity',
    'campus_announcement',
    'general'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- Name: payment_gateway; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_gateway AS ENUM (
    'stripe'
);


ALTER TYPE public.payment_gateway OWNER TO postgres;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- Name: semester_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.semester_type AS ENUM (
    'Spring',
    'Fall',
    'Summer',
    'Winter'
);


ALTER TYPE public.semester_type OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'student',
    'doctor',
    'admin',
    'teaching_assistant',
    'super_admin',
    'leader'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION storage.get_level(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION storage.get_prefix(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION storage.get_prefixes(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: academic_calendar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.academic_calendar (
    id integer NOT NULL,
    event_name text NOT NULL,
    event_type text NOT NULL,
    event_date date NOT NULL,
    end_date date,
    description text,
    semester text,
    academic_year text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone,
    created_by_user_id uuid
);


ALTER TABLE public.academic_calendar OWNER TO postgres;

--
-- Name: academic_calendar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.academic_calendar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.academic_calendar_id_seq OWNER TO postgres;

--
-- Name: academic_calendar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.academic_calendar_id_seq OWNED BY public.academic_calendar.id;


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    author_id uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    audience public.audience_type DEFAULT 'All'::public.audience_type NOT NULL,
    publish_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    expire_at timestamp(6) with time zone
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    student_user_id uuid NOT NULL,
    lecture_id integer,
    tutorial_lab_id integer,
    session_date date NOT NULL,
    status text NOT NULL
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: community_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.community_groups (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    avatar_url text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.community_groups OWNER TO postgres;

--
-- Name: community_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.community_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.community_groups_id_seq OWNER TO postgres;

--
-- Name: community_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.community_groups_id_seq OWNED BY public.community_groups.id;


--
-- Name: community_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.community_posts (
    id integer NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    image_url text,
    is_pinned boolean DEFAULT false,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    group_id integer
);


ALTER TABLE public.community_posts OWNER TO postgres;

--
-- Name: community_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.community_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.community_posts_id_seq OWNER TO postgres;

--
-- Name: community_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.community_posts_id_seq OWNED BY public.community_posts.id;


--
-- Name: course_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_materials (
    id integer NOT NULL,
    lecture_id integer,
    tutorial_lab_id integer,
    title text NOT NULL,
    url text,
    file_id uuid,
    uploaded_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.course_materials OWNER TO postgres;

--
-- Name: course_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_materials_id_seq OWNER TO postgres;

--
-- Name: course_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_materials_id_seq OWNED BY public.course_materials.id;


--
-- Name: course_offerings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_offerings (
    offering_id integer NOT NULL,
    course_code text NOT NULL,
    year integer NOT NULL,
    semester public.semester_type NOT NULL
);


ALTER TABLE public.course_offerings OWNER TO postgres;

--
-- Name: course_offerings_offering_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_offerings_offering_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_offerings_offering_id_seq OWNER TO postgres;

--
-- Name: course_offerings_offering_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_offerings_offering_id_seq OWNED BY public.course_offerings.offering_id;


--
-- Name: course_prerequisites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_prerequisites (
    course_code text NOT NULL,
    prerequisite_code text NOT NULL
);


ALTER TABLE public.course_prerequisites OWNER TO postgres;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    code text NOT NULL,
    name text NOT NULL,
    credits integer NOT NULL,
    department_id uuid NOT NULL
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    department_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    student_user_id uuid NOT NULL,
    lecture_id integer NOT NULL,
    tutorial_lab_id integer,
    mid_score double precision,
    work_score double precision,
    final_score double precision,
    grade text,
    status public.enrollment_status DEFAULT 'enrolled'::public.enrollment_status NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- Name: enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrollments_id_seq OWNER TO postgres;

--
-- Name: enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title text NOT NULL,
    event_date text NOT NULL,
    "time" text,
    location text,
    img_url text,
    link text,
    description text
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_id_seq OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: exams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exams (
    exam_id integer NOT NULL,
    offering_id integer NOT NULL,
    exam_type text NOT NULL,
    exam_date date NOT NULL,
    day_of_week text NOT NULL,
    start_time time(6) without time zone NOT NULL,
    end_time time(6) without time zone NOT NULL,
    location text
);


ALTER TABLE public.exams OWNER TO postgres;

--
-- Name: exams_exam_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exams_exam_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exams_exam_id_seq OWNER TO postgres;

--
-- Name: exams_exam_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exams_exam_id_seq OWNED BY public.exams.exam_id;


--
-- Name: files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.files (
    file_id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    media_type text,
    size_bytes bigint,
    uploaded_by_user_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.files OWNER TO postgres;

--
-- Name: financials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financials (
    id integer NOT NULL,
    department_id uuid NOT NULL,
    credit_price numeric NOT NULL
);


ALTER TABLE public.financials OWNER TO postgres;

--
-- Name: financials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.financials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.financials_id_seq OWNER TO postgres;

--
-- Name: financials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.financials_id_seq OWNED BY public.financials.id;


--
-- Name: grade_distributions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grade_distributions (
    id integer NOT NULL,
    lecture_id integer NOT NULL,
    work_max double precision NOT NULL,
    mid_max double precision NOT NULL,
    final_max double precision NOT NULL
);


ALTER TABLE public.grade_distributions OWNER TO postgres;

--
-- Name: grade_distributions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grade_distributions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grade_distributions_id_seq OWNER TO postgres;

--
-- Name: grade_distributions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grade_distributions_id_seq OWNED BY public.grade_distributions.id;


--
-- Name: group_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_members (
    group_id integer NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.group_members OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    student_user_id uuid NOT NULL,
    semester public.semester_type NOT NULL,
    year integer NOT NULL,
    total_amount numeric NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    stripe_session_id text,
    payment_date timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: lectures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lectures (
    lecture_id integer NOT NULL,
    offering_id integer NOT NULL,
    instructor_id uuid NOT NULL,
    capacity integer NOT NULL,
    day_of_week text NOT NULL,
    start_time time(6) without time zone NOT NULL,
    end_time time(6) without time zone NOT NULL,
    location text,
    "group" text,
    enrolled_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.lectures OWNER TO postgres;

--
-- Name: lectures_lecture_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lectures_lecture_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lectures_lecture_id_seq OWNER TO postgres;

--
-- Name: lectures_lecture_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lectures_lecture_id_seq OWNED BY public.lectures.lecture_id;


--
-- Name: news_articles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news_articles (
    id integer NOT NULL,
    title text NOT NULL,
    content text,
    publish_date date NOT NULL,
    image_url text,
    link text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.news_articles OWNER TO postgres;

--
-- Name: news_articles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.news_articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.news_articles_id_seq OWNER TO postgres;

--
-- Name: news_articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.news_articles_id_seq OWNED BY public.news_articles.id;


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences (
    user_id uuid NOT NULL,
    new_grade boolean DEFAULT true NOT NULL,
    exam_deadline boolean DEFAULT true NOT NULL,
    community_activity boolean DEFAULT false NOT NULL,
    campus_announcement boolean DEFAULT true NOT NULL
);


ALTER TABLE public.notification_preferences OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    type public.notification_type DEFAULT 'general'::public.notification_type NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    gateway public.payment_gateway NOT NULL,
    transaction_id text NOT NULL,
    amount numeric NOT NULL,
    status public.payment_status NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.post_comments OWNER TO postgres;

--
-- Name: post_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_comments_id_seq OWNER TO postgres;

--
-- Name: post_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_comments_id_seq OWNED BY public.post_comments.id;


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_likes (
    post_id integer NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.post_likes OWNER TO postgres;

--
-- Name: student_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_profiles (
    user_id uuid NOT NULL,
    student_id text NOT NULL,
    year_level integer DEFAULT 1,
    cgpa double precision,
    department_id uuid,
    total_credits integer,
    faculty_advisor_id uuid
);


ALTER TABLE public.student_profiles OWNER TO postgres;

--
-- Name: task_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_submissions (
    id integer NOT NULL,
    task_id integer NOT NULL,
    student_id uuid NOT NULL,
    submission_content text,
    submitted_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    grade double precision
);


ALTER TABLE public.task_submissions OWNER TO postgres;

--
-- Name: task_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_submissions_id_seq OWNER TO postgres;

--
-- Name: task_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_submissions_id_seq OWNED BY public.task_submissions.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    lecture_id integer,
    tutorial_lab_id integer,
    title text NOT NULL,
    description text,
    due_date timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.testimonials (
    id integer NOT NULL,
    student_name text NOT NULL,
    program text NOT NULL,
    quote text NOT NULL,
    image_url text,
    is_featured boolean DEFAULT false
);


ALTER TABLE public.testimonials OWNER TO postgres;

--
-- Name: testimonials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.testimonials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.testimonials_id_seq OWNER TO postgres;

--
-- Name: testimonials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.testimonials_id_seq OWNED BY public.testimonials.id;


--
-- Name: tutorials_labs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tutorials_labs (
    tutorial_lab_id integer NOT NULL,
    offering_id integer NOT NULL,
    ta_id uuid NOT NULL,
    type text NOT NULL,
    capacity integer NOT NULL,
    day_of_week text NOT NULL,
    start_time time(6) without time zone NOT NULL,
    end_time time(6) without time zone NOT NULL,
    location text,
    "group" text NOT NULL,
    enrolled_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.tutorials_labs OWNER TO postgres;

--
-- Name: tutorials_labs_tutorial_lab_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tutorials_labs_tutorial_lab_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tutorials_labs_tutorial_lab_id_seq OWNER TO postgres;

--
-- Name: tutorials_labs_tutorial_lab_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tutorials_labs_tutorial_lab_id_seq OWNED BY public.tutorials_labs.tutorial_lab_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role public.user_role NOT NULL,
    avatar_url text,
    phone text,
    national_id text,
    address text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: academic_calendar id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_calendar ALTER COLUMN id SET DEFAULT nextval('public.academic_calendar_id_seq'::regclass);


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: community_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_groups ALTER COLUMN id SET DEFAULT nextval('public.community_groups_id_seq'::regclass);


--
-- Name: community_posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_posts ALTER COLUMN id SET DEFAULT nextval('public.community_posts_id_seq'::regclass);


--
-- Name: course_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials ALTER COLUMN id SET DEFAULT nextval('public.course_materials_id_seq'::regclass);


--
-- Name: course_offerings offering_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_offerings ALTER COLUMN offering_id SET DEFAULT nextval('public.course_offerings_offering_id_seq'::regclass);


--
-- Name: enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: exams exam_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams ALTER COLUMN exam_id SET DEFAULT nextval('public.exams_exam_id_seq'::regclass);


--
-- Name: financials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financials ALTER COLUMN id SET DEFAULT nextval('public.financials_id_seq'::regclass);


--
-- Name: grade_distributions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_distributions ALTER COLUMN id SET DEFAULT nextval('public.grade_distributions_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: lectures lecture_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lectures ALTER COLUMN lecture_id SET DEFAULT nextval('public.lectures_lecture_id_seq'::regclass);


--
-- Name: news_articles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_articles ALTER COLUMN id SET DEFAULT nextval('public.news_articles_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: post_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments ALTER COLUMN id SET DEFAULT nextval('public.post_comments_id_seq'::regclass);


--
-- Name: task_submissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_submissions ALTER COLUMN id SET DEFAULT nextval('public.task_submissions_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: testimonials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.testimonials ALTER COLUMN id SET DEFAULT nextval('public.testimonials_id_seq'::regclass);


--
-- Name: tutorials_labs tutorial_lab_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutorials_labs ALTER COLUMN tutorial_lab_id SET DEFAULT nextval('public.tutorials_labs_tutorial_lab_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
7c1b3c5d-8e6f-42fc-8d03-01ae67df3c58	4cfa351904c39bdb75f0dbb87553a7890fa0aeb6a87e90063c66ff856e651789	2026-01-25 12:55:08.288909+00	20251208144000_add_tables	\N	\N	2026-01-25 12:55:07.350604+00	1
b8d1965c-674a-4328-b4ce-849e1d56af12	b1a66f7ae961874c59e9de8d1b603ef5ae785be050629ac943dd6b5263bb147f	2026-02-09 11:52:37.050692+00	20260207140017_add_community_features	\N	\N	2026-02-09 11:52:36.251757+00	1
f4fcc325-1a14-4ef5-9f21-40f867800d2b	122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec	2026-03-03 15:50:49.581441+00	20260303152457_add_academic_calendar_table	\N	\N	2026-03-03 15:50:49.133473+00	1
cb2b2e5b-015b-4fd9-b46c-15e1b6dc333d	45ec1646f05b007b06bf490dc653f44730c726f81911be6361c0d2b822f40f0a	2026-02-25 20:20:57.894193+00	20260225185418_semester_enum_year_drop_exam_name	\N	\N	2026-02-25 20:20:57.212022+00	1
a3c37a7d-6fa1-4f17-85b9-ab4c7fff7c3c	a4fd9e2d33a8effb604362e2d93c4170efaf0a2d7d4e71fce7d362d3eab118ed	2026-03-04 19:35:39.343297+00	20260304193537_add_enrolled_count_to_lectures_and_tutorials_labs	\N	\N	2026-03-04 19:35:38.603414+00	1
00f314dc-68f7-478a-93c7-71e0aac2c45e	59a06ec65d85e23e145937faa7d03e5534ea262b081445bf0b8d620656c4178e	2026-02-27 15:10:41.774618+00	20260227000000_enrollments_optional_lab	\N	\N	2026-02-27 15:10:41.055963+00	1
68b8e929-b3f3-4898-ab88-4f2d09d54c6c	7dab624152c95d1af7bfede85186590858390a25ec74b625b4f1d5ff5b978166	2026-02-28 23:08:08.224627+00	20260228230806_notification_type_enum_and_preferences	\N	\N	2026-02-28 23:08:07.455015+00	1
4d36b6a4-7c54-4bdd-bf89-eb969db00106	b9acde29ad2ed0042876772fd47e6002d9971aa6d2f56355f4be02e1fbad85b5	2026-03-03 01:01:39.381773+00	20260303010137_add_is_live_longitude_latitude_to_attendance	\N	\N	2026-03-03 01:01:38.59273+00	1
4948e8e0-a670-48f5-8a50-1f5069c41113	de2a4f7b5d870963756cecb94a706198f760f049eea481c483deb15a11d63179	2026-03-04 19:57:18.892773+00	20260304195717_add_grade_distributions	\N	\N	2026-03-04 19:57:18.072817+00	1
c2d5fd75-7f72-41d0-b337-e0ec5335cfa5	e457fcee44b19d073459aeebc0f63134836ff0e096a5da01c1a2d2e8ee6ce50f	2026-03-03 15:24:50.023414+00	20260303020000_add_academic_calendar_table	\N	\N	2026-03-03 15:24:49.524729+00	1
03c78ed2-321b-4758-9887-75e1a1cf375c	de057e3f0c45709cf22a3b317aadaec927e08de766414a343ddfdbaed8236da6	2026-03-16 11:34:27.767227+00	20260316000000_fix_attendance_drift_and_year_level_default	\N	\N	2026-03-16 11:34:27.036034+00	1
\.


--
-- Data for Name: academic_calendar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.academic_calendar (id, event_name, event_type, event_date, end_date, description, semester, academic_year, created_at, updated_at, created_by_user_id) FROM stdin;
1	Spring Semester Start	semester_start	2026-02-01	2026-06-20	Updated description	Spring 2026	2025-2026	2026-03-05 14:26:23.724+00	2026-03-05 14:30:37.776+00	c86640c2-def2-4c6f-8b60-8ac2ef55e091
3	Spring Semester Start	semester_start	2026-02-01	2026-06-15	Spring 2026 semester begins	Spring 2026	2025-2026	2026-03-05 14:33:51.472+00	2026-03-05 14:33:51.472+00	c86640c2-def2-4c6f-8b60-8ac2ef55e091
4	Spring Semester Start	semester_start	2026-02-01	2026-06-15	Spring 2026 semester begins	Spring 2026	2025-2026	2026-03-05 14:35:19.96+00	2026-03-05 14:35:19.96+00	c86640c2-def2-4c6f-8b60-8ac2ef55e091
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, author_id, title, content, audience, publish_at, expire_at) FROM stdin;
2	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Updated Title	Check the portal for your final exam timetable.	Faculty	2026-03-05 14:38:56.764+00	2026-04-01 00:00:00+00
1	c68e74b3-7a96-424b-b97b-0ed4f8b15b1f	Updated Title	Welcome to the new semester	Faculty	2026-01-25 12:55:43.063+00	\N
4	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Final Exam Schedule Released	Check the portal for your final exam timetable.	Students	2026-03-05 14:46:21.222+00	2026-04-01 00:00:00+00
5	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Final Exam Schedule Released	Check the portal for your final exam timetable.	Students	2026-03-05 19:40:44.732+00	2026-04-01 00:00:00+00
6	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Final Exam Schedule Released	Check the portal for your final exam timetable.	All	2026-03-05 19:41:02.136+00	2026-04-01 00:00:00+00
7	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Final Exam Schedule Released	Check the portal for your final exam timetable.	All	2026-03-05 19:41:05.687+00	2026-04-01 00:00:00+00
8	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Final Exam Schedule Released	Check the portal for your final exam timetable.	All	2026-03-05 19:41:07.448+00	2026-04-01 00:00:00+00
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, student_user_id, lecture_id, tutorial_lab_id, session_date, status) FROM stdin;
27	8b7809f6-609e-459f-81de-dec4ac30433a	8	\N	2026-03-03	absent
29	9c60d94a-99e3-44e7-86df-074833cab9e8	8	\N	2026-03-03	present
30	8b7809f6-609e-459f-81de-dec4ac30433a	8	\N	2026-03-11	absent
32	9c60d94a-99e3-44e7-86df-074833cab9e8	8	\N	2026-03-11	absent
28	f9338e22-6221-4c2b-bd47-3c423359fd87	8	\N	2026-03-03	present
31	f9338e22-6221-4c2b-bd47-3c423359fd87	8	\N	2026-03-11	present
33	9c60d94a-99e3-44e7-86df-074833cab9e8	12	\N	2026-03-11	present
34	e22abc55-4956-4050-baec-154fc02bd508	12	\N	2026-03-11	absent
35	5742bf70-e32a-41cc-89f4-736fff0da79e	12	\N	2026-03-11	absent
36	9c60d94a-99e3-44e7-86df-074833cab9e8	12	\N	2026-03-11	present
37	e22abc55-4956-4050-baec-154fc02bd508	12	\N	2026-03-11	present
38	5742bf70-e32a-41cc-89f4-736fff0da79e	12	\N	2026-03-11	absent
39	9c60d94a-99e3-44e7-86df-074833cab9e8	12	\N	2026-03-11	present
40	e22abc55-4956-4050-baec-154fc02bd508	12	\N	2026-03-11	present
41	5742bf70-e32a-41cc-89f4-736fff0da79e	12	\N	2026-03-11	present
42	9c60d94a-99e3-44e7-86df-074833cab9e8	12	\N	2026-03-12	absent
43	e22abc55-4956-4050-baec-154fc02bd508	12	\N	2026-03-12	present
44	5742bf70-e32a-41cc-89f4-736fff0da79e	12	\N	2026-03-12	absent
45	9c60d94a-99e3-44e7-86df-074833cab9e8	12	\N	2026-03-12	absent
46	e22abc55-4956-4050-baec-154fc02bd508	12	\N	2026-03-12	present
47	5742bf70-e32a-41cc-89f4-736fff0da79e	12	\N	2026-03-12	absent
\.


--
-- Data for Name: community_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.community_groups (id, name, description, avatar_url, created_at) FROM stdin;
1	JavaScript Study Group	A community for students learning and mastering JavaScript	\N	2026-02-14 16:53:53.317+00
3	nnn	this is AI	\N	2026-03-14 22:35:32.332+00
4	AI	artificial intelligence	\N	2026-03-15 00:15:02.46+00
\.


--
-- Data for Name: community_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.community_posts (id, author_id, content, image_url, is_pinned, created_at, group_id) FROM stdin;
2	c86640c2-def2-4c6f-8b60-8ac2ef55e091	hello world	https://www.bing.com/ck/a?!&&p=88eec19d622f65e260fe0545e3ac16341d37a693badd089ba1b7c6dec5fc1f89JmltdHM9MTc3MTgwNDgwMA&ptn=3&ver=2&hsh=4&fclid=3cc95286-509a-6820-10a0-472551e6693a&u=a1L2ltYWdlcy9zZWFyY2g_cT1pbWFnZXMmaWQ9RUVDRkJCN0Y0MzIwOTIxNTcxQTVCRDIwMjQ5QUI4NEQxNDhGODY3MyZGT1JNPUlRRlJCQQ	f	2026-02-23 13:13:56.988+00	1
3	c86640c2-def2-4c6f-8b60-8ac2ef55e091	hello worldggg	https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/JavaScript-logo.png/500px-JavaScript-logo.png	f	2026-02-23 14:03:54.637+00	1
4	c86640c2-def2-4c6f-8b60-8ac2ef55e091	nnnnnnnnnnnnnnnnnnn	https://images.pexels.com/photos/236047/pexels-photo-236047.jpeg?cs=srgb&dl=clouds-cloudy-countryside-236047.jpg&fm=jpg	f	2026-02-23 14:07:18.028+00	1
16	e5202808-9149-4799-b666-27e2e358c58c	h	\N	f	2026-03-02 15:49:06.449+00	\N
15	e5202808-9149-4799-b666-27e2e358c58c	ا	\N	f	2026-03-02 15:46:10.296+00	\N
14	9c60d94a-99e3-44e7-86df-074833cab9e8	g	\N	f	2026-03-02 15:26:58.042+00	\N
13	e5202808-9149-4799-b666-27e2e358c58c	hcf	\N	f	2026-03-02 13:48:07.925+00	\N
5	e5202808-9149-4799-b666-27e2e358c58c	This is my first community !	\N	f	2026-02-25 12:51:21.942+00	1
1	83b69f41-0b77-4acf-a84a-ad6518bc4e67	This is my first community post!	\N	f	2026-03-02 16:59:26.667+00	1
17	9c60d94a-99e3-44e7-86df-074833cab9e8	jj	blob:http://localhost:5173/5bbba1a5-3d35-4b79-a8bb-6df0b6085326	f	2026-03-04 19:44:41.61+00	\N
18	c86640c2-def2-4c6f-8b60-8ac2ef55e091	This is my first community post!	https://example.com/image.jpg	f	2026-03-04 19:50:39.489+00	1
19	c86640c2-def2-4c6f-8b60-8ac2ef55e091	This is my first community post!	https://example.com/image.jpg	f	2026-03-04 19:50:50.102+00	1
20	9c60d94a-99e3-44e7-86df-074833cab9e8	hi	blob:http://localhost:5173/6dbb6801-469f-4056-8807-86de03a811e3	f	2026-03-04 19:54:41.505+00	\N
21	9c60d94a-99e3-44e7-86df-074833cab9e8	kl	\N	f	2026-03-04 19:57:11.368+00	\N
22	c86640c2-def2-4c6f-8b60-8ac2ef55e091	This is my first community post!	https://www.google.com/imgres?q=image%20moon&imgurl=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2Fe%2Fe1%2FFullMoon2010.jpg%2F330px-FullMoon2010.jpg&imgrefurl=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FMoon&docid=rqZWM4HaPWtFJM&tbnid=qhAXq6_6nrKN8M&vet=12ahUKEwiOyO2HhYeTAxWBUKQEHdlIB3MQnPAOegQIFxAB..i&w=330&h=314&hcb=2&ved=2ahUKEwiOyO2HhYeTAxWBUKQEHdlIB3MQnPAOegQIFxAB	f	2026-03-04 20:04:08.365+00	1
23	c86640c2-def2-4c6f-8b60-8ac2ef55e091	This is  post!	https://example.com/image.jpg	f	2026-03-14 22:06:30.268+00	1
\.


--
-- Data for Name: course_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_materials (id, lecture_id, tutorial_lab_id, title, url, file_id, uploaded_at) FROM stdin;
20	11	\N	Lec.1_SDA.pdf	\N	b1363c9d-c07a-42c6-982b-4f366c532d9f	2026-03-01 19:41:47.495+00
21	8	\N	Lec01.pdf	\N	dcc97b6d-5d37-4490-a74f-74300b6293b7	2026-03-04 19:24:26.951+00
22	8	\N	website link	https://gs.alexu.edu.eg/FCDS/index.php	\N	2026-03-04 19:30:45.257+00
\.


--
-- Data for Name: course_offerings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_offerings (offering_id, course_code, year, semester) FROM stdin;
7	CS5050	2026	Fall
8	OOP500	2026	Fall
9	V202	2026	Fall
10	MATH222	2026	Fall
11	prob100	2026	Fall
\.


--
-- Data for Name: course_prerequisites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_prerequisites (course_code, prerequisite_code) FROM stdin;
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (code, name, credits, department_id) FROM stdin;
CS5050	Intro to CS	3	063e1341-2ace-4cc1-a03f-a61c7535fba8
OOP500	OOP	3	063e1341-2ace-4cc1-a03f-a61c7535fba8
V202	Visualization	3	063e1341-2ace-4cc1-a03f-a61c7535fba8
MATH222	MATH 2	3	063e1341-2ace-4cc1-a03f-a61c7535fba8
prob100	prob	3	063e1341-2ace-4cc1-a03f-a61c7535fba8
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (department_id, name) FROM stdin;
063e1341-2ace-4cc1-a03f-a61c7535fba8	Computer Science
f4165602-0e48-41e6-9362-4c7768d3ab10	Mathematics
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (student_user_id, lecture_id, tutorial_lab_id, mid_score, work_score, final_score, grade, status, id) FROM stdin;
8b7809f6-609e-459f-81de-dec4ac30433a	8	6	\N	\N	\N	\N	enrolled	23
f9338e22-6221-4c2b-bd47-3c423359fd87	8	6	18	30	46	A	completed	24
f9338e22-6221-4c2b-bd47-3c423359fd87	9	7	15	20	40	B	completed	25
9c60d94a-99e3-44e7-86df-074833cab9e8	8	6	10	\N	\N	\N	enrolled	32
9c60d94a-99e3-44e7-86df-074833cab9e8	10	9	15	\N	\N	\N	enrolled	30
f9338e22-6221-4c2b-bd47-3c423359fd87	10	8	\N	\N	\N	\N	enrolled	34
9c60d94a-99e3-44e7-86df-074833cab9e8	11	10	20	30	50	A	completed	35
9c60d94a-99e3-44e7-86df-074833cab9e8	12	11	\N	\N	\N	\N	enrolled	36
e22abc55-4956-4050-baec-154fc02bd508	12	11	\N	\N	\N	\N	enrolled	37
e22abc55-4956-4050-baec-154fc02bd508	11	10	\N	\N	\N	\N	enrolled	38
5742bf70-e32a-41cc-89f4-736fff0da79e	12	11	\N	\N	\N	\N	enrolled	39
5742bf70-e32a-41cc-89f4-736fff0da79e	11	10	\N	\N	\N	\N	enrolled	40
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, title, event_date, "time", location, img_url, link, description) FROM stdin;
3	Ai 2026	2026-04-05	09:00	Innovation Lab, Building C	https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop	https://example.com/register	24-hour coding challenge.
4	techne 2026	2026-04-05	09:00	Innovation Lab, Building C	\N	https://example.com/register	24-hour coding challenge.
5	tt 2026	2025-01-05	09:00	Innovation Lab, Building C	\N	https://example.com/register	24-hour coding challenge.
6	tt 2026	2025-01-05	09:00	Innovation Lab, Building C	\N	https://example.com/register	24-hour coding challenge.
7	nna	2026-05-04	04:10	alex	\N	\N	eventttt
1	Hackathon 2026	2025-04-05	09:00	Building d	https://example.com/event.jpg	https://example.com/register	hour coding challenge.
8	ASQ WCQI 2026	2026-05-02	14:42	alex	\N	\N	ASQ WCQI 2026
\.


--
-- Data for Name: exams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exams (exam_id, offering_id, exam_type, exam_date, day_of_week, start_time, end_time, location) FROM stdin;
4	9	Midterm	2026-03-16	Monday	09:00:00	11:00:00	Hall A
5	10	Midterm	2026-03-16	Monday	09:00:00	11:00:00	Hall A
6	11	Midterm	2026-03-16	Monday	12:00:00	14:00:00	Room 105
3	8	Midterm	2026-03-16	Monday	09:00:00	11:00:00	Hall B
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.files (file_id, file_name, file_path, media_type, size_bytes, uploaded_by_user_id, created_at) FROM stdin;
b1363c9d-c07a-42c6-982b-4f366c532d9f	Lec.1_SDA.pdf	materials/83b69f41-0b77-4acf-a84a-ad6518bc4e67/1772394105040.pdf	application/pdf	737098	83b69f41-0b77-4acf-a84a-ad6518bc4e67	2026-03-01 19:41:47.335+00
dcc97b6d-5d37-4490-a74f-74300b6293b7	Lec01.pdf	materials/c86640c2-def2-4c6f-8b60-8ac2ef55e091/1772652264680.pdf	application/pdf	1365984	c86640c2-def2-4c6f-8b60-8ac2ef55e091	2026-03-04 19:24:26.793+00
\.


--
-- Data for Name: financials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financials (id, department_id, credit_price) FROM stdin;
\.


--
-- Data for Name: grade_distributions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grade_distributions (id, lecture_id, work_max, mid_max, final_max) FROM stdin;
1	9	20	30	50
2	11	30	20	50
3	10	30	20	50
4	8	20	20	60
\.


--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.group_members (group_id, user_id, joined_at) FROM stdin;
1	83b69f41-0b77-4acf-a84a-ad6518bc4e67	2026-02-14 16:53:54.708+00
1	9c60d94a-99e3-44e7-86df-074833cab9e8	2026-03-05 23:28:34.755+00
1	c86640c2-def2-4c6f-8b60-8ac2ef55e091	2026-03-15 00:08:46.041+00
4	c86640c2-def2-4c6f-8b60-8ac2ef55e091	2026-03-15 00:15:03.089+00
3	c86640c2-def2-4c6f-8b60-8ac2ef55e091	2026-03-15 00:48:04.172+00
4	9c60d94a-99e3-44e7-86df-074833cab9e8	2026-03-15 00:49:56.114+00
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, student_user_id, semester, year, total_amount, status, stripe_session_id, payment_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lectures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lectures (lecture_id, offering_id, instructor_id, capacity, day_of_week, start_time, end_time, location, "group", enrolled_count) FROM stdin;
9	8	55a5ad2a-06e0-495f-abf5-f72a00e0c78a	50	Thursday	08:00:00	10:00:00	Room 104	1	1
10	9	63487637-4a00-47ba-ba31-0b16f0ec4734	150	Thursday	08:00:00	10:00:00	Room 105	1	2
12	11	83b69f41-0b77-4acf-a84a-ad6518bc4e67	150	Thursday	01:00:00	03:00:00	Room 105	1	3
11	10	83b69f41-0b77-4acf-a84a-ad6518bc4e67	150	Friday	11:00:00	13:00:00	Room 102	1	2
13	10	83b69f41-0b77-4acf-a84a-ad6518bc4e67	150	Monday	08:30:00	10:00:00	Room 101	2	0
8	7	2b6258b2-360e-4a9d-bfbb-aa6c8b073da4	50	Sunday	14:00:00	16:00:00	Room 102	1	3
\.


--
-- Data for Name: news_articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.news_articles (id, title, content, publish_date, image_url, link, created_at) FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_preferences (user_id, new_grade, exam_deadline, community_activity, campus_announcement) FROM stdin;
8b7809f6-609e-459f-81de-dec4ac30433a	t	t	t	t
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, message, is_read, created_at, type) FROM stdin;
17	9c60d94a-99e3-44e7-86df-074833cab9e8	You have successfully registered for: Intro to CS.	f	2026-03-04 19:19:52.583+00	general
18	9c60d94a-99e3-44e7-86df-074833cab9e8	You have successfully registered for: MATH 2.	f	2026-03-04 19:20:08.073+00	general
19	83b69f41-0b77-4acf-a84a-ad6518bc4e67	Magda Madbouly posted in JavaScript Study Group: "This is my first community post!".	f	2026-03-04 19:50:41.345+00	community_activity
20	83b69f41-0b77-4acf-a84a-ad6518bc4e67	Magda Madbouly posted in JavaScript Study Group: "This is my first community post!".	f	2026-03-04 19:50:51.325+00	community_activity
21	83b69f41-0b77-4acf-a84a-ad6518bc4e67	Magda Madbouly posted in JavaScript Study Group: "This is my first community post!".	f	2026-03-04 20:04:10.292+00	community_activity
22	8b7809f6-609e-459f-81de-dec4ac30433a	You have successfully registered for: Intro to CS.	f	2026-03-04 21:00:14.419+00	general
23	8b7809f6-609e-459f-81de-dec4ac30433a	You have successfully registered for: Intro to CS.	f	2026-03-04 21:03:55.076+00	general
24	f9338e22-6221-4c2b-bd47-3c423359fd87	You have successfully registered for: Intro to CS.	f	2026-03-04 21:05:24.103+00	general
25	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-04 21:08:25.331+00	general
26	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-04 21:08:25.649+00	general
27	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-04 21:08:25.965+00	general
28	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-04 21:14:14.556+00	general
29	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-04 21:14:14.899+00	general
30	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-04 21:14:15.215+00	general
31	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-04 21:24:55.526+00	general
32	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-04 21:24:55.861+00	general
33	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-04 21:24:56.179+00	general
34	f9338e22-6221-4c2b-bd47-3c423359fd87	Your attendance has been marked successfully.	f	2026-03-04 21:29:07.71+00	general
35	f9338e22-6221-4c2b-bd47-3c423359fd87	Your grades for Intro to CS have been updated. Total: 94/100 — Grade: A — your enrollment is now completed.	f	2026-03-04 21:33:47.285+00	new_grade
36	f9338e22-6221-4c2b-bd47-3c423359fd87	Your grades for Intro to CS have been updated. Total: 94/100 — Grade: A — your enrollment is now completed.	f	2026-03-04 21:46:20.969+00	new_grade
37	f9338e22-6221-4c2b-bd47-3c423359fd87	Your grades for Intro to CS have been updated. Total: 94/100 — Grade: A — your enrollment is now completed.	f	2026-03-04 21:53:06.218+00	new_grade
38	f9338e22-6221-4c2b-bd47-3c423359fd87	You have successfully registered for: OOP.	f	2026-03-04 21:55:12.754+00	general
39	f9338e22-6221-4c2b-bd47-3c423359fd87	Your grades for OOP have been updated. Total: 75/100 — Grade: B — your enrollment is now completed.	f	2026-03-04 21:58:48.235+00	new_grade
40	9c60d94a-99e3-44e7-86df-074833cab9e8	You have successfully registered for: Visualization.	f	2026-03-04 23:01:08.887+00	general
41	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-04 23:02:29.766+00	general
42	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-04 23:02:33.227+00	general
43	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from Intro to CS.	f	2026-03-04 23:05:11.05+00	general
44	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from Visualization.	f	2026-03-04 23:05:18.094+00	general
45	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from MATH 2.	f	2026-03-04 23:05:26.901+00	general
46	9c60d94a-99e3-44e7-86df-074833cab9e8	You have successfully registered for: Visualization.	f	2026-03-04 23:06:48.214+00	general
47	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from Visualization.	f	2026-03-04 23:07:00.915+00	general
48	9c60d94a-99e3-44e7-86df-074833cab9e8	You have successfully registered for: Visualization.	f	2026-03-04 23:07:11.143+00	general
49	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-04 23:07:19.211+00	general
50	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-04 23:07:21.855+00	general
51	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from Visualization.	f	2026-03-04 23:07:42.629+00	general
52	9c60d94a-99e3-44e7-86df-074833cab9e8	You have successfully registered for: Visualization.	f	2026-03-04 23:08:17.816+00	general
53	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-04 23:08:28.303+00	general
54	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-04 23:08:31.629+00	general
55	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-04 23:09:02.424+00	general
56	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-04 23:09:05.722+00	general
57	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from Visualization.	f	2026-03-04 23:09:25.793+00	general
58	9c60d94a-99e3-44e7-86df-074833cab9e8	You have successfully registered for: Visualization.	f	2026-03-04 23:10:18.702+00	general
59	9c60d94a-99e3-44e7-86df-074833cab9e8	You have successfully registered for: Intro to CS.	f	2026-03-04 23:10:36.609+00	general
60	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from Intro to CS.	f	2026-03-04 23:10:46.51+00	general
61	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-04 23:14:46.021+00	general
62	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-04 23:14:49.245+00	general
63	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-04 23:21:59.744+00	general
64	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-04 23:32:16.236+00	general
65	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-04 23:33:39.59+00	general
66	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-04 23:33:42.886+00	general
67	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-04 23:35:16.14+00	general
68	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-04 23:35:19.873+00	general
69	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-04 23:38:11.53+00	general
70	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-04 23:38:14.881+00	general
71	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-04 23:40:10.581+00	general
72	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-04 23:40:13.299+00	general
73	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-04 23:41:28.508+00	general
74	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-04 23:41:31.911+00	general
75	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-04 23:47:17.475+00	general
76	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-04 23:47:20.204+00	general
77	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-04 23:58:58.062+00	general
78	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-04 23:59:01.388+00	general
79	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-05 00:04:53.362+00	general
80	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-05 00:04:57.144+00	general
81	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-05 00:05:39.273+00	general
82	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-05 00:05:42.569+00	general
83	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-05 00:11:43.398+00	general
84	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-05 00:11:46.772+00	general
85	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-05 00:13:08.5+00	general
86	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-05 00:13:11.825+00	general
87	9c60d94a-99e3-44e7-86df-074833cab9e8	You have successfully registered for: Intro to CS.	f	2026-03-05 00:47:34.179+00	general
88	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-05 00:47:54.73+00	general
89	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-05 00:47:58.08+00	general
90	9c60d94a-99e3-44e7-86df-074833cab9e8	You have successfully registered for: MATH 2.	f	2026-03-05 00:48:29.93+00	general
91	e22abc55-4956-4050-baec-154fc02bd508	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:38:57.637+00	campus_announcement
92	5742bf70-e32a-41cc-89f4-736fff0da79e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:38:57.968+00	campus_announcement
93	3b1ce93f-f09c-4c03-8040-1b34a2e6ad13	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:38:58.268+00	campus_announcement
94	e5202808-9149-4799-b666-27e2e358c58c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:38:58.567+00	campus_announcement
95	28af57a9-5df9-4a1f-ab46-3b1b66b8319c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:38:58.867+00	campus_announcement
96	629bbaf0-edf6-43b7-aacf-c528b1e7fa39	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:38:59.167+00	campus_announcement
97	79fe3b0d-3e8b-4467-a71a-682e21904279	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:38:59.467+00	campus_announcement
98	ed55c420-42b5-4103-ae89-6ecd87135077	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:38:59.766+00	campus_announcement
99	5fbbbdc9-ac4e-4cd7-85b3-2704ad2ea7ba	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:39:00.077+00	campus_announcement
100	0ca7bae8-b231-4b16-a641-a9bff5975709	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:39:00.377+00	campus_announcement
101	9c60d94a-99e3-44e7-86df-074833cab9e8	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:39:00.677+00	campus_announcement
102	f7e1aeaa-97a8-406c-aea1-bfe0e5d0dbd9	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:39:01.079+00	campus_announcement
103	932aa420-6769-43ff-833f-e0fe2ab66e33	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:39:02.107+00	campus_announcement
104	96fe4daa-b598-42bd-a50d-ccbdb693858c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:39:02.587+00	campus_announcement
105	7a24bca9-be15-45c0-afcf-0a9cc1a4633d	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:39:03.228+00	campus_announcement
106	6eef4c08-90ec-42cd-8302-6bd133777c6e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:39:03.937+00	campus_announcement
107	4f42ac1a-dd74-47e8-ad14-e49bf34f008a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:39:04.817+00	campus_announcement
108	2b70682e-1292-4352-bcbd-99b4a4431af7	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:39:05.118+00	campus_announcement
109	2f55184d-bea4-4540-86fd-dd25f9ecee2c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:39:05.417+00	campus_announcement
110	8b7809f6-609e-459f-81de-dec4ac30433a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:39:05.717+00	campus_announcement
111	f9338e22-6221-4c2b-bd47-3c423359fd87	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:39:06.017+00	campus_announcement
112	e22abc55-4956-4050-baec-154fc02bd508	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:07.726+00	campus_announcement
113	5742bf70-e32a-41cc-89f4-736fff0da79e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:08.027+00	campus_announcement
114	3b1ce93f-f09c-4c03-8040-1b34a2e6ad13	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:08.357+00	campus_announcement
115	e5202808-9149-4799-b666-27e2e358c58c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:08.657+00	campus_announcement
116	28af57a9-5df9-4a1f-ab46-3b1b66b8319c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:08.946+00	campus_announcement
117	629bbaf0-edf6-43b7-aacf-c528b1e7fa39	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:09.248+00	campus_announcement
118	79fe3b0d-3e8b-4467-a71a-682e21904279	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:09.557+00	campus_announcement
119	ed55c420-42b5-4103-ae89-6ecd87135077	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:09.856+00	campus_announcement
120	5fbbbdc9-ac4e-4cd7-85b3-2704ad2ea7ba	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:10.149+00	campus_announcement
121	0ca7bae8-b231-4b16-a641-a9bff5975709	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:10.726+00	campus_announcement
122	9c60d94a-99e3-44e7-86df-074833cab9e8	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:11.026+00	campus_announcement
123	f7e1aeaa-97a8-406c-aea1-bfe0e5d0dbd9	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:11.318+00	campus_announcement
124	932aa420-6769-43ff-833f-e0fe2ab66e33	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:11.616+00	campus_announcement
125	96fe4daa-b598-42bd-a50d-ccbdb693858c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:11.917+00	campus_announcement
126	7a24bca9-be15-45c0-afcf-0a9cc1a4633d	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:12.208+00	campus_announcement
127	6eef4c08-90ec-42cd-8302-6bd133777c6e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:12.507+00	campus_announcement
128	4f42ac1a-dd74-47e8-ad14-e49bf34f008a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:12.797+00	campus_announcement
129	2b70682e-1292-4352-bcbd-99b4a4431af7	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:13.097+00	campus_announcement
130	2f55184d-bea4-4540-86fd-dd25f9ecee2c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:13.387+00	campus_announcement
131	8b7809f6-609e-459f-81de-dec4ac30433a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:13.687+00	campus_announcement
132	f9338e22-6221-4c2b-bd47-3c423359fd87	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:41:13.986+00	campus_announcement
133	e22abc55-4956-4050-baec-154fc02bd508	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:21.549+00	campus_announcement
134	5742bf70-e32a-41cc-89f4-736fff0da79e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:21.849+00	campus_announcement
135	3b1ce93f-f09c-4c03-8040-1b34a2e6ad13	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:22.149+00	campus_announcement
136	e5202808-9149-4799-b666-27e2e358c58c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:22.441+00	campus_announcement
137	28af57a9-5df9-4a1f-ab46-3b1b66b8319c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:22.73+00	campus_announcement
138	629bbaf0-edf6-43b7-aacf-c528b1e7fa39	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:23.019+00	campus_announcement
139	79fe3b0d-3e8b-4467-a71a-682e21904279	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:23.31+00	campus_announcement
140	ed55c420-42b5-4103-ae89-6ecd87135077	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:23.61+00	campus_announcement
141	5fbbbdc9-ac4e-4cd7-85b3-2704ad2ea7ba	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:23.909+00	campus_announcement
142	0ca7bae8-b231-4b16-a641-a9bff5975709	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:24.2+00	campus_announcement
143	9c60d94a-99e3-44e7-86df-074833cab9e8	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:24.499+00	campus_announcement
144	f7e1aeaa-97a8-406c-aea1-bfe0e5d0dbd9	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:24.799+00	campus_announcement
145	932aa420-6769-43ff-833f-e0fe2ab66e33	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:25.08+00	campus_announcement
146	96fe4daa-b598-42bd-a50d-ccbdb693858c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:25.369+00	campus_announcement
147	7a24bca9-be15-45c0-afcf-0a9cc1a4633d	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:25.66+00	campus_announcement
148	6eef4c08-90ec-42cd-8302-6bd133777c6e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:25.939+00	campus_announcement
149	4f42ac1a-dd74-47e8-ad14-e49bf34f008a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:26.24+00	campus_announcement
150	2b70682e-1292-4352-bcbd-99b4a4431af7	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:26.529+00	campus_announcement
151	2f55184d-bea4-4540-86fd-dd25f9ecee2c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:26.819+00	campus_announcement
152	8b7809f6-609e-459f-81de-dec4ac30433a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:27.119+00	campus_announcement
153	f9338e22-6221-4c2b-bd47-3c423359fd87	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 14:46:27.411+00	campus_announcement
154	e22abc55-4956-4050-baec-154fc02bd508	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:33.97+00	campus_announcement
155	5742bf70-e32a-41cc-89f4-736fff0da79e	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:34.26+00	campus_announcement
156	3b1ce93f-f09c-4c03-8040-1b34a2e6ad13	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:34.56+00	campus_announcement
157	e5202808-9149-4799-b666-27e2e358c58c	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:34.84+00	campus_announcement
158	28af57a9-5df9-4a1f-ab46-3b1b66b8319c	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:35.14+00	campus_announcement
159	629bbaf0-edf6-43b7-aacf-c528b1e7fa39	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:35.42+00	campus_announcement
160	79fe3b0d-3e8b-4467-a71a-682e21904279	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:35.71+00	campus_announcement
161	ed55c420-42b5-4103-ae89-6ecd87135077	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:35.99+00	campus_announcement
162	5fbbbdc9-ac4e-4cd7-85b3-2704ad2ea7ba	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:36.38+00	campus_announcement
163	0ca7bae8-b231-4b16-a641-a9bff5975709	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:36.66+00	campus_announcement
164	9c60d94a-99e3-44e7-86df-074833cab9e8	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:36.95+00	campus_announcement
165	f7e1aeaa-97a8-406c-aea1-bfe0e5d0dbd9	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:37.26+00	campus_announcement
166	932aa420-6769-43ff-833f-e0fe2ab66e33	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:37.55+00	campus_announcement
167	96fe4daa-b598-42bd-a50d-ccbdb693858c	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:37.84+00	campus_announcement
168	7a24bca9-be15-45c0-afcf-0a9cc1a4633d	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:38.13+00	campus_announcement
169	6eef4c08-90ec-42cd-8302-6bd133777c6e	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:38.42+00	campus_announcement
170	4f42ac1a-dd74-47e8-ad14-e49bf34f008a	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:38.73+00	campus_announcement
171	2b70682e-1292-4352-bcbd-99b4a4431af7	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:39.02+00	campus_announcement
172	2f55184d-bea4-4540-86fd-dd25f9ecee2c	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:39.3+00	campus_announcement
173	8b7809f6-609e-459f-81de-dec4ac30433a	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:39.59+00	campus_announcement
174	f9338e22-6221-4c2b-bd47-3c423359fd87	Course registration is now open! Head to the registration portal to enroll in your courses.	f	2026-03-05 14:48:39.88+00	campus_announcement
175	e22abc55-4956-4050-baec-154fc02bd508	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:45.459+00	campus_announcement
176	5742bf70-e32a-41cc-89f4-736fff0da79e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:45.761+00	campus_announcement
177	3b1ce93f-f09c-4c03-8040-1b34a2e6ad13	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:46.044+00	campus_announcement
178	e5202808-9149-4799-b666-27e2e358c58c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:46.331+00	campus_announcement
179	28af57a9-5df9-4a1f-ab46-3b1b66b8319c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:46.614+00	campus_announcement
401	f9338e22-6221-4c2b-bd47-3c423359fd87	New task "Assignment 1" has been added for OOP. Due: 4/2/2026.	f	2026-03-12 09:56:01.394+00	exam_deadline
180	629bbaf0-edf6-43b7-aacf-c528b1e7fa39	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:46.898+00	campus_announcement
181	79fe3b0d-3e8b-4467-a71a-682e21904279	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:47.193+00	campus_announcement
182	ed55c420-42b5-4103-ae89-6ecd87135077	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:47.476+00	campus_announcement
183	5fbbbdc9-ac4e-4cd7-85b3-2704ad2ea7ba	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:47.769+00	campus_announcement
184	0ca7bae8-b231-4b16-a641-a9bff5975709	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:48.08+00	campus_announcement
185	9c60d94a-99e3-44e7-86df-074833cab9e8	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:48.395+00	campus_announcement
186	f7e1aeaa-97a8-406c-aea1-bfe0e5d0dbd9	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:48.756+00	campus_announcement
187	932aa420-6769-43ff-833f-e0fe2ab66e33	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:49.05+00	campus_announcement
188	96fe4daa-b598-42bd-a50d-ccbdb693858c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:49.333+00	campus_announcement
189	7a24bca9-be15-45c0-afcf-0a9cc1a4633d	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:49.614+00	campus_announcement
190	6eef4c08-90ec-42cd-8302-6bd133777c6e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:49.896+00	campus_announcement
191	4f42ac1a-dd74-47e8-ad14-e49bf34f008a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:50.178+00	campus_announcement
192	2b70682e-1292-4352-bcbd-99b4a4431af7	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:50.467+00	campus_announcement
193	2f55184d-bea4-4540-86fd-dd25f9ecee2c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:51.059+00	campus_announcement
195	8b7809f6-609e-459f-81de-dec4ac30433a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:51.628+00	campus_announcement
196	f9338e22-6221-4c2b-bd47-3c423359fd87	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:40:51.909+00	campus_announcement
197	c86640c2-def2-4c6f-8b60-8ac2ef55e091	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:02.841+00	campus_announcement
198	c68e74b3-7a96-424b-b97b-0ed4f8b15b1f	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:03.125+00	campus_announcement
199	55a5ad2a-06e0-495f-abf5-f72a00e0c78a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:03.401+00	campus_announcement
200	83b69f41-0b77-4acf-a84a-ad6518bc4e67	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:03.68+00	campus_announcement
201	08a62103-62ea-4c37-8b75-58991e6a6f0c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:03.986+00	campus_announcement
202	e22abc55-4956-4050-baec-154fc02bd508	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:04.318+00	campus_announcement
203	5742bf70-e32a-41cc-89f4-736fff0da79e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:04.603+00	campus_announcement
204	3b1ce93f-f09c-4c03-8040-1b34a2e6ad13	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:04.879+00	campus_announcement
205	e5202808-9149-4799-b666-27e2e358c58c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:05.162+00	campus_announcement
206	28af57a9-5df9-4a1f-ab46-3b1b66b8319c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:05.442+00	campus_announcement
207	629bbaf0-edf6-43b7-aacf-c528b1e7fa39	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:05.797+00	campus_announcement
208	79fe3b0d-3e8b-4467-a71a-682e21904279	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:06.08+00	campus_announcement
209	c86640c2-def2-4c6f-8b60-8ac2ef55e091	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:06.332+00	campus_announcement
210	ed55c420-42b5-4103-ae89-6ecd87135077	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:06.361+00	campus_announcement
211	c68e74b3-7a96-424b-b97b-0ed4f8b15b1f	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:06.611+00	campus_announcement
212	5fbbbdc9-ac4e-4cd7-85b3-2704ad2ea7ba	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:06.649+00	campus_announcement
213	0ca7bae8-b231-4b16-a641-a9bff5975709	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:07.109+00	campus_announcement
214	55a5ad2a-06e0-495f-abf5-f72a00e0c78a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:07.112+00	campus_announcement
215	63487637-4a00-47ba-ba31-0b16f0ec4734	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:07.456+00	campus_announcement
216	83b69f41-0b77-4acf-a84a-ad6518bc4e67	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:07.468+00	campus_announcement
217	85ab8582-4f48-4e1f-a380-bdf412a22e84	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:07.742+00	campus_announcement
218	08a62103-62ea-4c37-8b75-58991e6a6f0c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:07.746+00	campus_announcement
219	9c60d94a-99e3-44e7-86df-074833cab9e8	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:08.045+00	campus_announcement
220	e22abc55-4956-4050-baec-154fc02bd508	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:08.047+00	campus_announcement
221	c86640c2-def2-4c6f-8b60-8ac2ef55e091	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:08.155+00	campus_announcement
222	f7e1aeaa-97a8-406c-aea1-bfe0e5d0dbd9	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:08.344+00	campus_announcement
223	5742bf70-e32a-41cc-89f4-736fff0da79e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:08.352+00	campus_announcement
224	c68e74b3-7a96-424b-b97b-0ed4f8b15b1f	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:08.429+00	campus_announcement
225	932aa420-6769-43ff-833f-e0fe2ab66e33	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:08.667+00	campus_announcement
226	3b1ce93f-f09c-4c03-8040-1b34a2e6ad13	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:08.678+00	campus_announcement
227	55a5ad2a-06e0-495f-abf5-f72a00e0c78a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:08.789+00	campus_announcement
228	96fe4daa-b598-42bd-a50d-ccbdb693858c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:08.985+00	campus_announcement
402	f9338e22-6221-4c2b-bd47-3c423359fd87	New task "Assignment 2" has been added for OOP. Due: 4/2/2026.	f	2026-03-12 11:02:11.008+00	exam_deadline
403	9c60d94a-99e3-44e7-86df-074833cab9e8	New task "Assignment 2" has been added for MATH 2. Due: 4/2/2026.	f	2026-03-13 14:59:42.495+00	exam_deadline
229	e5202808-9149-4799-b666-27e2e358c58c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:09.002+00	campus_announcement
232	28af57a9-5df9-4a1f-ab46-3b1b66b8319c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:09.282+00	campus_announcement
235	629bbaf0-edf6-43b7-aacf-c528b1e7fa39	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:09.562+00	campus_announcement
238	79fe3b0d-3e8b-4467-a71a-682e21904279	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:09.941+00	campus_announcement
241	ed55c420-42b5-4103-ae89-6ecd87135077	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:10.221+00	campus_announcement
244	5fbbbdc9-ac4e-4cd7-85b3-2704ad2ea7ba	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:10.661+00	campus_announcement
247	0ca7bae8-b231-4b16-a641-a9bff5975709	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:11.015+00	campus_announcement
250	63487637-4a00-47ba-ba31-0b16f0ec4734	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:11.289+00	campus_announcement
253	85ab8582-4f48-4e1f-a380-bdf412a22e84	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:11.567+00	campus_announcement
256	9c60d94a-99e3-44e7-86df-074833cab9e8	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:11.841+00	campus_announcement
259	f7e1aeaa-97a8-406c-aea1-bfe0e5d0dbd9	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:12.297+00	campus_announcement
262	932aa420-6769-43ff-833f-e0fe2ab66e33	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:13.23+00	campus_announcement
265	96fe4daa-b598-42bd-a50d-ccbdb693858c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:14.151+00	campus_announcement
267	7a24bca9-be15-45c0-afcf-0a9cc1a4633d	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:15.072+00	campus_announcement
269	db6f1fa7-47f3-4511-917c-e8f28294b980	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:15.353+00	campus_announcement
271	6eef4c08-90ec-42cd-8302-6bd133777c6e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:15.628+00	campus_announcement
273	4f42ac1a-dd74-47e8-ad14-e49bf34f008a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:16.034+00	campus_announcement
275	2b70682e-1292-4352-bcbd-99b4a4431af7	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:16.311+00	campus_announcement
277	2f55184d-bea4-4540-86fd-dd25f9ecee2c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:16.586+00	campus_announcement
279	2b6258b2-360e-4a9d-bfbb-aa6c8b073da4	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:16.86+00	campus_announcement
281	53f277fa-323a-4d1c-afa7-577a7c1ac847	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:17.138+00	campus_announcement
285	4a5c326d-ba47-4561-9c0d-3416812a3391	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:17.688+00	campus_announcement
287	8b7809f6-609e-459f-81de-dec4ac30433a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:17.964+00	campus_announcement
289	f9338e22-6221-4c2b-bd47-3c423359fd87	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:18.24+00	campus_announcement
230	83b69f41-0b77-4acf-a84a-ad6518bc4e67	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:09.064+00	campus_announcement
233	08a62103-62ea-4c37-8b75-58991e6a6f0c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:09.364+00	campus_announcement
236	e22abc55-4956-4050-baec-154fc02bd508	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:09.639+00	campus_announcement
239	5742bf70-e32a-41cc-89f4-736fff0da79e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:09.994+00	campus_announcement
242	3b1ce93f-f09c-4c03-8040-1b34a2e6ad13	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:10.269+00	campus_announcement
245	e5202808-9149-4799-b666-27e2e358c58c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:10.71+00	campus_announcement
248	28af57a9-5df9-4a1f-ab46-3b1b66b8319c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:11.056+00	campus_announcement
251	629bbaf0-edf6-43b7-aacf-c528b1e7fa39	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:11.329+00	campus_announcement
254	79fe3b0d-3e8b-4467-a71a-682e21904279	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:11.602+00	campus_announcement
257	ed55c420-42b5-4103-ae89-6ecd87135077	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:11.874+00	campus_announcement
260	5fbbbdc9-ac4e-4cd7-85b3-2704ad2ea7ba	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:12.626+00	campus_announcement
263	0ca7bae8-b231-4b16-a641-a9bff5975709	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:13.534+00	campus_announcement
266	63487637-4a00-47ba-ba31-0b16f0ec4734	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:14.468+00	campus_announcement
268	85ab8582-4f48-4e1f-a380-bdf412a22e84	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:15.161+00	campus_announcement
270	9c60d94a-99e3-44e7-86df-074833cab9e8	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:15.437+00	campus_announcement
272	f7e1aeaa-97a8-406c-aea1-bfe0e5d0dbd9	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:15.735+00	campus_announcement
274	932aa420-6769-43ff-833f-e0fe2ab66e33	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:16.12+00	campus_announcement
276	96fe4daa-b598-42bd-a50d-ccbdb693858c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:16.396+00	campus_announcement
278	7a24bca9-be15-45c0-afcf-0a9cc1a4633d	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:16.673+00	campus_announcement
280	db6f1fa7-47f3-4511-917c-e8f28294b980	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:16.947+00	campus_announcement
282	6eef4c08-90ec-42cd-8302-6bd133777c6e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:17.221+00	campus_announcement
284	4f42ac1a-dd74-47e8-ad14-e49bf34f008a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:17.495+00	campus_announcement
286	2b70682e-1292-4352-bcbd-99b4a4431af7	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:17.769+00	campus_announcement
288	2f55184d-bea4-4540-86fd-dd25f9ecee2c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:18.044+00	campus_announcement
290	2b6258b2-360e-4a9d-bfbb-aa6c8b073da4	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:18.321+00	campus_announcement
291	53f277fa-323a-4d1c-afa7-577a7c1ac847	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:18.594+00	campus_announcement
293	4a5c326d-ba47-4561-9c0d-3416812a3391	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:19.848+00	campus_announcement
294	8b7809f6-609e-459f-81de-dec4ac30433a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:20.123+00	campus_announcement
295	f9338e22-6221-4c2b-bd47-3c423359fd87	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:20.399+00	campus_announcement
231	7a24bca9-be15-45c0-afcf-0a9cc1a4633d	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:09.279+00	campus_announcement
234	db6f1fa7-47f3-4511-917c-e8f28294b980	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:09.554+00	campus_announcement
237	6eef4c08-90ec-42cd-8302-6bd133777c6e	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:09.911+00	campus_announcement
240	4f42ac1a-dd74-47e8-ad14-e49bf34f008a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:10.188+00	campus_announcement
243	2b70682e-1292-4352-bcbd-99b4a4431af7	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:10.579+00	campus_announcement
246	2f55184d-bea4-4540-86fd-dd25f9ecee2c	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:10.975+00	campus_announcement
249	2b6258b2-360e-4a9d-bfbb-aa6c8b073da4	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:11.249+00	campus_announcement
252	53f277fa-323a-4d1c-afa7-577a7c1ac847	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:11.524+00	campus_announcement
258	4a5c326d-ba47-4561-9c0d-3416812a3391	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:12.296+00	campus_announcement
261	8b7809f6-609e-459f-81de-dec4ac30433a	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:13.229+00	campus_announcement
264	f9338e22-6221-4c2b-bd47-3c423359fd87	[Announcement] Final Exam Schedule Released: Check the portal for your final exam timetable.	f	2026-03-05 19:41:14.15+00	campus_announcement
296	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Student 1 liked your post.	f	2026-03-06 01:39:41.673+00	community_activity
297	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from the lab for Visualization.	f	2026-03-06 01:40:44.078+00	general
298	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been registered for lab 1 in Visualization.	f	2026-03-06 01:40:47.603+00	general
299	9c60d94a-99e3-44e7-86df-074833cab9e8	You have been unregistered from MATH 2.	f	2026-03-06 01:41:04.348+00	general
300	f9338e22-6221-4c2b-bd47-3c423359fd87	You have successfully registered for: Visualization.	f	2026-03-06 13:46:40.915+00	general
301	f9338e22-6221-4c2b-bd47-3c423359fd87	You have successfully registered for: MATH 2.	f	2026-03-06 13:56:51.36+00	general
302	f9338e22-6221-4c2b-bd47-3c423359fd87	Your grades for MATH 2 have been updated. Total: 100/100 — Grade: A — your enrollment is now completed.	f	2026-03-06 14:03:37.952+00	new_grade
303	83b69f41-0b77-4acf-a84a-ad6518bc4e67	Student 1 liked your post.	f	2026-03-10 21:18:57.071+00	community_activity
304	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Student 1 commented on your post: "Great post! Thanks for sharing.".	f	2026-03-10 21:37:05.25+00	community_activity
305	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Student 1 commented on your post: "kuyiu".	f	2026-03-10 21:41:41.118+00	community_activity
306	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Student 1 commented on your post: "mmnhjk".	f	2026-03-10 21:44:15.764+00	community_activity
307	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Student 1 commented on your post: "k".	f	2026-03-10 21:44:54.795+00	community_activity
308	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Student 1 liked your post.	f	2026-03-10 21:45:14.694+00	community_activity
309	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Student 1 liked your post.	f	2026-03-10 21:45:35.251+00	community_activity
310	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Student 1 commented on your post: "ggh".	f	2026-03-10 22:17:49.139+00	community_activity
311	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Student 1 commented on your post: "ll".	f	2026-03-10 22:24:54.171+00	community_activity
312	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Student 1 commented on your post: "lkjnm".	f	2026-03-10 22:25:00.513+00	community_activity
313	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Student 1 commented on your post: "ljhkjipko[p".	f	2026-03-10 22:25:07.381+00	community_activity
314	c86640c2-def2-4c6f-8b60-8ac2ef55e091	Student 1 commented on your post: "n".	f	2026-03-10 23:35:10.677+00	community_activity
315	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 04:39:25.326+00	general
316	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 04:39:25.687+00	general
317	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 04:39:25.983+00	general
318	f9338e22-6221-4c2b-bd47-3c423359fd87	Your attendance has been marked successfully.	f	2026-03-11 04:40:02.483+00	general
319	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 04:44:55.488+00	general
320	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 04:44:55.82+00	general
321	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 04:44:56.09+00	general
322	f9338e22-6221-4c2b-bd47-3c423359fd87	Your attendance has been marked successfully.	f	2026-03-11 04:45:10.655+00	general
323	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 05:00:32.503+00	general
324	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 05:00:32.794+00	general
325	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 05:00:33.081+00	general
326	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 05:03:42.993+00	general
327	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 05:03:43.293+00	general
328	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 05:03:43.574+00	general
329	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:13:37.674+00	general
330	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:13:37.972+00	general
331	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:13:38.237+00	general
332	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:14:51.038+00	general
333	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:14:51.349+00	general
334	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:14:51.624+00	general
335	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:14:58.378+00	general
336	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:14:58.654+00	general
337	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:14:58.934+00	general
338	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:33:59.133+00	general
339	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:33:59.474+00	general
340	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:33:59.769+00	general
341	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:34:19.568+00	general
342	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:34:19.85+00	general
343	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 06:34:20.136+00	general
344	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 07:22:16.32+00	general
345	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 07:22:16.666+00	general
346	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 07:22:16.959+00	general
347	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 08:23:20.004+00	general
348	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 08:23:20.323+00	general
349	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 08:23:20.602+00	general
350	83b69f41-0b77-4acf-a84a-ad6518bc4e67	Magda Madbouly commented on your post: "This is my comment".	f	2026-03-11 08:59:38.541+00	community_activity
351	83b69f41-0b77-4acf-a84a-ad6518bc4e67	Magda Madbouly commented on your post: "This is my comment".	f	2026-03-11 08:59:47.977+00	community_activity
352	83b69f41-0b77-4acf-a84a-ad6518bc4e67	Magda Madbouly commented on your post: "This is my comment".	f	2026-03-11 08:59:49.682+00	community_activity
353	83b69f41-0b77-4acf-a84a-ad6518bc4e67	Magda Madbouly liked your post.	f	2026-03-11 09:07:29.495+00	community_activity
354	83b69f41-0b77-4acf-a84a-ad6518bc4e67	Magda Madbouly liked your post.	f	2026-03-11 09:08:01.584+00	community_activity
355	83b69f41-0b77-4acf-a84a-ad6518bc4e67	Student 1 liked your post.	f	2026-03-11 09:08:32.154+00	community_activity
356	83b69f41-0b77-4acf-a84a-ad6518bc4e67	Student 9 liked your post.	f	2026-03-11 09:08:59.497+00	community_activity
357	8b7809f6-609e-459f-81de-dec4ac30433a	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 09:22:02.608+00	general
358	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 09:22:02.9+00	general
359	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for Intro to CS. Scan the QR code to mark your attendance.	f	2026-03-11 09:22:03.18+00	general
360	f9338e22-6221-4c2b-bd47-3c423359fd87	Attendance session started for MATH 2. Scan the QR code to mark your attendance.	f	2026-03-11 22:50:56.25+00	general
361	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for MATH 2. Scan the QR code to mark your attendance.	f	2026-03-11 22:54:14.447+00	general
362	9c60d94a-99e3-44e7-86df-074833cab9e8	You have successfully registered for: prob.	f	2026-03-11 22:59:42.665+00	general
363	e22abc55-4956-4050-baec-154fc02bd508	You have successfully registered for: prob.	f	2026-03-11 23:01:07.753+00	general
364	e22abc55-4956-4050-baec-154fc02bd508	You have successfully registered for: MATH 2.	f	2026-03-11 23:01:15.508+00	general
365	5742bf70-e32a-41cc-89f4-736fff0da79e	You have successfully registered for: prob.	f	2026-03-11 23:01:54.5+00	general
366	5742bf70-e32a-41cc-89f4-736fff0da79e	You have successfully registered for: MATH 2.	f	2026-03-11 23:02:01.972+00	general
367	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-11 23:03:08.129+00	general
368	e22abc55-4956-4050-baec-154fc02bd508	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-11 23:03:08.465+00	general
369	5742bf70-e32a-41cc-89f4-736fff0da79e	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-11 23:03:08.799+00	general
370	9c60d94a-99e3-44e7-86df-074833cab9e8	Your attendance has been marked successfully.	f	2026-03-11 23:08:07.713+00	general
371	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-11 23:12:04.685+00	general
372	e22abc55-4956-4050-baec-154fc02bd508	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-11 23:12:05.015+00	general
373	5742bf70-e32a-41cc-89f4-736fff0da79e	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-11 23:12:05.344+00	general
374	e22abc55-4956-4050-baec-154fc02bd508	Your attendance has been marked successfully.	f	2026-03-11 23:12:09.413+00	general
375	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-11 23:19:50.079+00	general
376	e22abc55-4956-4050-baec-154fc02bd508	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-11 23:19:50.425+00	general
377	5742bf70-e32a-41cc-89f4-736fff0da79e	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-11 23:19:50.757+00	general
378	e22abc55-4956-4050-baec-154fc02bd508	Your attendance has been marked successfully.	f	2026-03-11 23:20:28.134+00	general
379	9c60d94a-99e3-44e7-86df-074833cab9e8	Your attendance has been marked successfully.	f	2026-03-11 23:21:41.811+00	general
380	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-11 23:22:17.782+00	general
381	e22abc55-4956-4050-baec-154fc02bd508	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-11 23:22:18.106+00	general
382	5742bf70-e32a-41cc-89f4-736fff0da79e	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-11 23:22:18.429+00	general
383	9c60d94a-99e3-44e7-86df-074833cab9e8	Your attendance has been marked successfully.	f	2026-03-11 23:22:21.868+00	general
384	5742bf70-e32a-41cc-89f4-736fff0da79e	Your attendance has been marked successfully.	f	2026-03-11 23:23:43.297+00	general
385	e22abc55-4956-4050-baec-154fc02bd508	Your attendance has been marked successfully.	f	2026-03-11 23:24:27.625+00	general
386	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-12 00:27:13.392+00	general
387	e22abc55-4956-4050-baec-154fc02bd508	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-12 00:27:13.749+00	general
388	5742bf70-e32a-41cc-89f4-736fff0da79e	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-12 00:27:14.084+00	general
389	e22abc55-4956-4050-baec-154fc02bd508	Your attendance has been marked successfully.	f	2026-03-12 00:30:34.827+00	general
390	e22abc55-4956-4050-baec-154fc02bd508	Your attendance has been marked successfully.	f	2026-03-12 00:30:53.323+00	general
391	e22abc55-4956-4050-baec-154fc02bd508	Your attendance has been marked successfully.	f	2026-03-12 00:37:20.181+00	general
392	5742bf70-e32a-41cc-89f4-736fff0da79e	Warning: You have accumulated 3 absences. Further absences may affect your academic standing.	f	2026-03-12 00:39:41.697+00	general
393	9c60d94a-99e3-44e7-86df-074833cab9e8	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-12 00:42:26.44+00	general
394	e22abc55-4956-4050-baec-154fc02bd508	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-12 00:42:26.785+00	general
395	5742bf70-e32a-41cc-89f4-736fff0da79e	Attendance session started for prob. Scan the QR code to mark your attendance.	f	2026-03-12 00:42:27.115+00	general
396	e22abc55-4956-4050-baec-154fc02bd508	Your attendance has been marked successfully.	f	2026-03-12 00:42:55.092+00	general
397	f9338e22-6221-4c2b-bd47-3c423359fd87	New task "Assignment 1" has been added for OOP. Due: 4/2/2026.	f	2026-03-12 09:50:14.366+00	exam_deadline
398	9c60d94a-99e3-44e7-86df-074833cab9e8	New task "Assignment 1" has been added for MATH 2. Due: 4/2/2026.	f	2026-03-12 09:55:32.684+00	exam_deadline
399	e22abc55-4956-4050-baec-154fc02bd508	New task "Assignment 1" has been added for MATH 2. Due: 4/2/2026.	f	2026-03-12 09:55:32.983+00	exam_deadline
400	5742bf70-e32a-41cc-89f4-736fff0da79e	New task "Assignment 1" has been added for MATH 2. Due: 4/2/2026.	f	2026-03-12 09:55:33.394+00	exam_deadline
404	e22abc55-4956-4050-baec-154fc02bd508	New task "Assignment 2" has been added for MATH 2. Due: 4/2/2026.	f	2026-03-13 14:59:42.827+00	exam_deadline
405	5742bf70-e32a-41cc-89f4-736fff0da79e	New task "Assignment 2" has been added for MATH 2. Due: 4/2/2026.	f	2026-03-13 14:59:43.135+00	exam_deadline
406	9c60d94a-99e3-44e7-86df-074833cab9e8	A Midterm exam has been scheduled for prob on 3/16/2026.	f	2026-03-13 22:18:13.994+00	exam_deadline
407	e22abc55-4956-4050-baec-154fc02bd508	A Midterm exam has been scheduled for prob on 3/16/2026.	f	2026-03-13 22:18:14.523+00	exam_deadline
408	5742bf70-e32a-41cc-89f4-736fff0da79e	A Midterm exam has been scheduled for prob on 3/16/2026.	f	2026-03-13 22:18:15.015+00	exam_deadline
409	83b69f41-0b77-4acf-a84a-ad6518bc4e67	Magda Madbouly posted in JavaScript Study Group: "This is  post!".	f	2026-03-14 22:06:32.226+00	community_activity
410	9c60d94a-99e3-44e7-86df-074833cab9e8	Magda Madbouly posted in JavaScript Study Group: "This is  post!".	f	2026-03-14 22:06:32.729+00	community_activity
411	9c60d94a-99e3-44e7-86df-074833cab9e8	Reminder: You have a Midterm exam for Visualization tomorrow (3/16/2026).	f	2026-03-15 00:00:01.468+00	exam_deadline
412	f9338e22-6221-4c2b-bd47-3c423359fd87	Reminder: You have a Midterm exam for Visualization tomorrow (3/16/2026).	f	2026-03-15 00:00:01.975+00	exam_deadline
413	e22abc55-4956-4050-baec-154fc02bd508	Reminder: You have a Midterm exam for MATH 2 tomorrow (3/16/2026).	f	2026-03-15 00:00:02.594+00	exam_deadline
414	5742bf70-e32a-41cc-89f4-736fff0da79e	Reminder: You have a Midterm exam for MATH 2 tomorrow (3/16/2026).	f	2026-03-15 00:00:03.06+00	exam_deadline
415	9c60d94a-99e3-44e7-86df-074833cab9e8	Reminder: You have a Midterm exam for prob tomorrow (3/16/2026).	f	2026-03-15 00:00:03.681+00	exam_deadline
416	e22abc55-4956-4050-baec-154fc02bd508	Reminder: You have a Midterm exam for prob tomorrow (3/16/2026).	f	2026-03-15 00:00:04.147+00	exam_deadline
417	5742bf70-e32a-41cc-89f4-736fff0da79e	Reminder: You have a Midterm exam for prob tomorrow (3/16/2026).	f	2026-03-15 00:00:04.612+00	exam_deadline
418	ed55c420-42b5-4103-ae89-6ecd87135077	You have successfully registered for: Intro to CS.	f	2026-03-16 12:12:02.758+00	general
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, invoice_id, gateway, transaction_id, amount, status, created_at) FROM stdin;
\.


--
-- Data for Name: post_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_comments (id, post_id, author_id, content, created_at) FROM stdin;
1	1	9c60d94a-99e3-44e7-86df-074833cab9e8	This is my comment	2026-02-14 17:07:31.675+00
2	1	2f55184d-bea4-4540-86fd-dd25f9ecee2c	helloooo tessst	2026-03-03 02:31:15+00
3	1	9c60d94a-99e3-44e7-86df-074833cab9e8	gg	2026-03-03 02:32:27.623+00
4	1	9c60d94a-99e3-44e7-86df-074833cab9e8	work well	2026-03-03 02:36:44.795+00
5	4	9c60d94a-99e3-44e7-86df-074833cab9e8	wow 😲	2026-03-03 02:39:40.002+00
6	20	9c60d94a-99e3-44e7-86df-074833cab9e8	bonooo!	2026-03-06 01:39:53.362+00
7	2	9c60d94a-99e3-44e7-86df-074833cab9e8	Great post! Thanks for sharing.	2026-03-10 21:37:04.256+00
8	2	9c60d94a-99e3-44e7-86df-074833cab9e8	kuyiu	2026-03-10 21:41:40.123+00
9	2	9c60d94a-99e3-44e7-86df-074833cab9e8	mmnhjk	2026-03-10 21:44:14.73+00
10	2	9c60d94a-99e3-44e7-86df-074833cab9e8	k	2026-03-10 21:44:53.821+00
11	2	9c60d94a-99e3-44e7-86df-074833cab9e8	ggh	2026-03-10 22:17:48.138+00
12	2	9c60d94a-99e3-44e7-86df-074833cab9e8	ll	2026-03-10 22:24:53.204+00
13	2	9c60d94a-99e3-44e7-86df-074833cab9e8	lkjnm	2026-03-10 22:24:59.555+00
14	2	9c60d94a-99e3-44e7-86df-074833cab9e8	ljhkjipko[p	2026-03-10 22:25:06.423+00
15	2	9c60d94a-99e3-44e7-86df-074833cab9e8	n	2026-03-10 23:35:09.653+00
16	1	c86640c2-def2-4c6f-8b60-8ac2ef55e091	This is my comment	2026-03-11 08:59:37.902+00
17	1	c86640c2-def2-4c6f-8b60-8ac2ef55e091	This is my comment	2026-03-11 08:59:47.44+00
18	1	c86640c2-def2-4c6f-8b60-8ac2ef55e091	This is my comment	2026-03-11 08:59:49.161+00
\.


--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_likes (post_id, user_id, created_at) FROM stdin;
1	79fe3b0d-3e8b-4467-a71a-682e21904279	2026-03-03 01:57:56+00
16	9c60d94a-99e3-44e7-86df-074833cab9e8	2026-03-03 02:17:43.691+00
21	9c60d94a-99e3-44e7-86df-074833cab9e8	2026-03-10 21:33:03.069+00
19	9c60d94a-99e3-44e7-86df-074833cab9e8	2026-03-10 21:45:14.203+00
22	9c60d94a-99e3-44e7-86df-074833cab9e8	2026-03-10 21:45:34.756+00
1	c86640c2-def2-4c6f-8b60-8ac2ef55e091	2026-03-11 09:08:00.544+00
1	9c60d94a-99e3-44e7-86df-074833cab9e8	2026-03-11 09:08:31.605+00
1	ed55c420-42b5-4103-ae89-6ecd87135077	2026-03-11 09:08:59.189+00
\.


--
-- Data for Name: student_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_profiles (user_id, student_id, year_level, cgpa, department_id, total_credits, faculty_advisor_id) FROM stdin;
96fe4daa-b598-42bd-a50d-ccbdb693858c	1122	\N	\N	\N	\N	\N
f7e1aeaa-97a8-406c-aea1-bfe0e5d0dbd9	2021001	\N	\N	\N	\N	\N
932aa420-6769-43ff-833f-e0fe2ab66e33	2021002	\N	\N	\N	\N	\N
7a24bca9-be15-45c0-afcf-0a9cc1a4633d	2021003	\N	\N	\N	\N	\N
6eef4c08-90ec-42cd-8302-6bd133777c6e	2022001	\N	\N	\N	\N	\N
4f42ac1a-dd74-47e8-ad14-e49bf34f008a	2022002	\N	\N	\N	\N	\N
2b70682e-1292-4352-bcbd-99b4a4431af7	2022003	\N	\N	\N	\N	\N
2f55184d-bea4-4540-86fd-dd25f9ecee2c	2022004	\N	\N	\N	\N	\N
4ca9258d-4d70-47b8-a7b9-a5c7eae70c9c	2024001234	1	\N	063e1341-2ace-4cc1-a03f-a61c7535fba8	\N	\N
ed55c420-42b5-4103-ae89-6ecd87135077	S2025109	3	\N	063e1341-2ace-4cc1-a03f-a61c7535fba8	\N	\N
8b7809f6-609e-459f-81de-dec4ac30433a	S2026101	\N	\N	\N	3	\N
28af57a9-5df9-4a1f-ab46-3b1b66b8319c	S2025106	4	\N	063e1341-2ace-4cc1-a03f-a61c7535fba8	\N	\N
3b1ce93f-f09c-4c03-8040-1b34a2e6ad13	S2025104	2	\N	063e1341-2ace-4cc1-a03f-a61c7535fba8	\N	\N
5742bf70-e32a-41cc-89f4-736fff0da79e	S2025103	4	\N	063e1341-2ace-4cc1-a03f-a61c7535fba8	\N	\N
5fbbbdc9-ac4e-4cd7-85b3-2704ad2ea7ba	S2025110	4	\N	063e1341-2ace-4cc1-a03f-a61c7535fba8	\N	\N
629bbaf0-edf6-43b7-aacf-c528b1e7fa39	S2025107	3	\N	063e1341-2ace-4cc1-a03f-a61c7535fba8	\N	\N
79fe3b0d-3e8b-4467-a71a-682e21904279	S2025108	1	\N	063e1341-2ace-4cc1-a03f-a61c7535fba8	\N	\N
9c60d94a-99e3-44e7-86df-074833cab9e8	S2025101	2	\N	063e1341-2ace-4cc1-a03f-a61c7535fba8	\N	\N
e22abc55-4956-4050-baec-154fc02bd508	S2025102	4	\N	063e1341-2ace-4cc1-a03f-a61c7535fba8	\N	\N
e5202808-9149-4799-b666-27e2e358c58c	S2025105	3	\N	063e1341-2ace-4cc1-a03f-a61c7535fba8	\N	\N
f9338e22-6221-4c2b-bd47-3c423359fd87	22010100	1	3.67	063e1341-2ace-4cc1-a03f-a61c7535fba8	9	\N
49ddf91a-b089-4494-a166-8703a94cbbda	2000	\N	\N	063e1341-2ace-4cc1-a03f-a61c7535fba8	\N	\N
\.


--
-- Data for Name: task_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_submissions (id, task_id, student_id, submission_content, submitted_at, grade) FROM stdin;
6	6	9c60d94a-99e3-44e7-86df-074833cab9e8	Here is my solution...	2026-03-13 15:50:12.344+00	\N
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, lecture_id, tutorial_lab_id, title, description, due_date, created_at) FROM stdin;
2	9	\N	Assignment 1	Submit a report on normalization.	2026-04-01 23:59:00+00	2026-03-12 09:50:14.019+00
3	11	\N	Assignment 1	Submit a report on normalization.	2026-04-01 23:59:00+00	2026-03-12 09:55:32.365+00
4	9	\N	Assignment 1	Submit a report on normalization.	2026-04-01 23:59:00+00	2026-03-12 09:56:01.104+00
5	9	\N	Assignment 2	Submit a report on normalization.	2026-04-01 23:59:00+00	2026-03-12 11:02:10.693+00
6	11	\N	Assignment 2	Submit a report on normalization.	2026-04-01 23:59:00+00	2026-03-13 14:59:41.974+00
7	13	\N	Assignment 2	Submit a report on normalization.	2026-04-01 23:59:00+00	2026-03-13 14:59:42.095+00
\.


--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.testimonials (id, student_name, program, quote, image_url, is_featured) FROM stdin;
\.


--
-- Data for Name: tutorials_labs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tutorials_labs (tutorial_lab_id, offering_id, ta_id, type, capacity, day_of_week, start_time, end_time, location, "group", enrolled_count) FROM stdin;
7	8	08a62103-62ea-4c37-8b75-58991e6a6f0c	LAB	50	Wednesday	08:00:00	10:00:00	Lab 212	1	1
9	9	53f277fa-323a-4d1c-afa7-577a7c1ac847	LAB	150	Wednesday	12:00:00	14:00:00	Room 122	1	1
8	9	53f277fa-323a-4d1c-afa7-577a7c1ac847	LAB	150	Wednesday	08:00:00	10:00:00	Room 105	1	1
11	11	53f277fa-323a-4d1c-afa7-577a7c1ac847	LAB	150	Tuesday	15:00:00	17:00:00	Room 105	1	3
10	10	08a62103-62ea-4c37-8b75-58991e6a6f0c	LAB	150	Saturday	10:00:00	12:00:00	Lab 212	1	2
6	7	53f277fa-323a-4d1c-afa7-577a7c1ac847	LAB	50	Monday	14:00:00	16:00:00	Room 102	1	3
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, full_name, email, password_hash, role, avatar_url, phone, national_id, address, created_at, updated_at) FROM stdin;
c68e74b3-7a96-424b-b97b-0ed4f8b15b1f	Admin User	admin@example.com	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	admin	\N	\N	\N	\N	2026-01-25 12:55:35.763+00	2026-01-25 12:55:35.763+00
55a5ad2a-06e0-495f-abf5-f72a00e0c78a	Dr. Alice	doctor.alice@example.com	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	doctor	\N	\N	\N	\N	2026-01-25 12:55:35.908+00	2026-01-25 12:55:35.908+00
83b69f41-0b77-4acf-a84a-ad6518bc4e67	Dr. Bob	doctor.bob@example.com	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	doctor	\N	\N	\N	\N	2026-01-25 12:55:36.053+00	2026-01-25 12:55:36.053+00
08a62103-62ea-4c37-8b75-58991e6a6f0c	TA John	ta.john@example.com	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	teaching_assistant	\N	\N	\N	\N	2026-01-25 12:55:36.194+00	2026-01-25 12:55:36.194+00
e22abc55-4956-4050-baec-154fc02bd508	Student 2	student2@example.com	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	student	\N	\N	\N	\N	2026-01-25 12:55:36.658+00	2026-01-25 12:55:36.658+00
5742bf70-e32a-41cc-89f4-736fff0da79e	Student 3	student3@example.com	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	student	\N	\N	\N	\N	2026-01-25 12:55:36.947+00	2026-01-25 12:55:36.947+00
3b1ce93f-f09c-4c03-8040-1b34a2e6ad13	Student 4	student4@example.com	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	student	\N	\N	\N	\N	2026-01-25 12:55:37.227+00	2026-01-25 12:55:37.227+00
e5202808-9149-4799-b666-27e2e358c58c	Student 5	student5@example.com	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	student	\N	\N	\N	\N	2026-01-25 12:55:37.508+00	2026-01-25 12:55:37.508+00
28af57a9-5df9-4a1f-ab46-3b1b66b8319c	Student 6	student6@example.com	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	student	\N	\N	\N	\N	2026-01-25 12:55:37.798+00	2026-01-25 12:55:37.798+00
629bbaf0-edf6-43b7-aacf-c528b1e7fa39	Student 7	student7@example.com	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	student	\N	\N	\N	\N	2026-01-25 12:55:38.099+00	2026-01-25 12:55:38.099+00
79fe3b0d-3e8b-4467-a71a-682e21904279	Student 8	student8@example.com	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	student	\N	\N	\N	\N	2026-01-25 12:55:38.387+00	2026-01-25 12:55:38.387+00
ed55c420-42b5-4103-ae89-6ecd87135077	Student 9	student9@example.com	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	student	\N	\N	\N	\N	2026-01-25 12:55:38.68+00	2026-01-25 12:55:38.68+00
5fbbbdc9-ac4e-4cd7-85b3-2704ad2ea7ba	Student 10	student10@example.com	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	student	\N	\N	\N	\N	2026-01-25 12:55:39.039+00	2026-01-25 12:55:39.039+00
0ca7bae8-b231-4b16-a641-a9bff5975709	John Smith	john.smith@example.edu	$2b$10$jQyHPbnbYkT7N8JYqewcPurtMJ9UnN.QHvHSsS9y12j1OQiNrmX7y	student	\N	\N	\N	\N	2026-01-26 17:24:47.3+00	2026-01-26 17:24:47.3+00
4ca9258d-4d70-47b8-a7b9-a5c7eae70c9c	Sara Mohamed	sara.mohamed@example.edu	$2b$10$nQYIaHxaLcHHixdvdZe5reux5fskSSB3l7Gn.oP3js.ibrGiqQTh6	student	\N	\N	30001011234567	\N	2026-03-16 04:32:34.916+00	2026-03-16 04:32:34.916+00
c86640c2-def2-4c6f-8b60-8ac2ef55e091	Magda Madbouly	magda_madbouly@example.com	$2b$10$NSJnpGUcPWqAGGot9vFkgeayYK25k4SQ/XO6OE5zh5ORGGg/x8f96	super_admin	https://pbnfvqohslrvyblgqzaz.supabase.co/storage/v1/object/public/avatars/c86640c2-def2-4c6f-8b60-8ac2ef55e091/avatar_c86640c2-def2-4c6f-8b60-8ac2ef55e091_1773638395052.jpg	+201234567890	20907192200123	123 Admin St, Cairo, Egypt	2026-01-25 12:55:35.604+00	2026-01-25 12:55:35.604+00
f9338e22-6221-4c2b-bd47-3c423359fd87	Ziad Mohamed	ziad.mohamed@example.com	$2b$10$WYIhfVhQjB/QFyFbkYDPz.xu.s7f.v/roOBREl2DnnpJCyvEHVUHy	student	https://pbnfvqohslrvyblgqzaz.supabase.co/storage/v1/object/public/avatars/f9338e22-6221-4c2b-bd47-3c423359fd87/avatar_f9338e22-6221-4c2b-bd47-3c423359fd87_1773642063186	01011122256	30402385433179	الحضرة الجديدة	2026-03-04 14:48:55.563+00	2026-03-04 14:48:55.563+00
63487637-4a00-47ba-ba31-0b16f0ec4734	Prof. Bob Williams	bob.williams@college.edu	$2b$10$I52qpPieHKul3NZqNIsU5e2H.arWf2uP8..NDDMbImGwtdOqcRHmq	teaching_assistant	\N	\N	\N	\N	2026-02-19 11:50:10.166+00	2026-02-19 11:50:10.166+00
85ab8582-4f48-4e1f-a380-bdf412a22e84	Diana Prince	diana.prince@college.edu	$2b$10$2ibrpcDT2e0c4dgIpaRfxetm.IByIys8lxxH4BsduHp1Z124pFXDS	admin	\N	\N	\N	\N	2026-02-19 11:50:11+00	2026-02-19 11:50:11+00
9c60d94a-99e3-44e7-86df-074833cab9e8	Student 1	student1@example.com	$2b$10$rp90cmKlfqO7GyiEofGQn.a1XLqFn3d4ur9MuWFcfHeVvKSkV8WXW	student	https://pbnfvqohslrvyblgqzaz.supabase.co/storage/v1/object/public/avatars/9c60d94a-99e3-44e7-86df-074833cab9e8/avatar_9c60d94a-99e3-44e7-86df-074833cab9e8_1771068805027.png	01136564892	30405132600822	Alexandria - Moharram bek	2026-01-25 12:55:36.349+00	2026-01-25 12:55:36.349+00
f7e1aeaa-97a8-406c-aea1-bfe0e5d0dbd9	John Doe	john.doe@college.edu	$2b$10$AATvULaE1om/G3oCKxDAf.60dNOY4YiAC18M4VtHqFDBjedyZq4sK	student	\N	\N	\N	\N	2026-02-19 11:43:36.436+00	2026-02-19 11:43:36.436+00
932aa420-6769-43ff-833f-e0fe2ab66e33	Jane Smith	jane.smith@college.edu	$2b$10$l5vp.mpExOMuvGnkUra6N.Z.MKO72FsFS3Ez.r8/MUpZbhliIuQY.	student	\N	\N	\N	\N	2026-02-19 11:43:37.109+00	2026-02-19 11:43:37.109+00
96fe4daa-b598-42bd-a50d-ccbdb693858c	Ahmed Qabary	ahmedkabary@example.edu	$2b$10$eFIhB43ctwbgvSIIIcot8ODSgsbG6gYz3C2FFJgfkK9ICNrgZzeHO	student	https://pbnfvqohslrvyblgqzaz.supabase.co/storage/v1/object/public/avatars/96fe4daa-b598-42bd-a50d-ccbdb693858c/avatar_96fe4daa-b598-42bd-a50d-ccbdb693858c_1769858132952.jpg	01122267427	30312110201318	Wardian, Alexandria	2026-01-29 17:03:38.512+00	2026-01-29 17:03:38.512+00
7a24bca9-be15-45c0-afcf-0a9cc1a4633d	Charlie Brown	charlie.brown@college.edu	$2b$10$l.L2HgWsXcpOZ5IUWoDxFODk9PGxQiNV/.9jrEx1DiCSzT4twg0eq	student	\N	\N	\N	\N	2026-02-19 11:43:38.772+00	2026-02-19 11:43:38.772+00
db6f1fa7-47f3-4511-917c-e8f28294b980	Dr. Alice Johnson	alice.johnson@college.edu	$2b$10$0Ysc7qHHgamxjgV.WGYqUuqHGSk8tDkkDhUXD1/mZJFfSEefx5tlK	doctor	\N	\N	\N	\N	2026-02-19 11:50:09.477+00	2026-02-19 11:50:09.477+00
4f42ac1a-dd74-47e8-ad14-e49bf34f008a	Sara Mohamed	sara.mohamed@college.edu	$2b$10$txEW8qIZQfeZn.8Q2xzU8.JYfk1iwzLMmeqGAAJOPATfO1xAUigWa	student	\N	\N	\N	\N	2026-02-19 11:55:03.982+00	2026-02-19 11:55:03.982+00
2b70682e-1292-4352-bcbd-99b4a4431af7	Omar Ali	omar.ali@college.edu	$2b$10$NeDckNXlopIU8BI5fIIqqeh.4mP571ysIdiNUzWy8lJ8QSl9tlUFC	student	\N	\N	\N	\N	2026-02-19 11:55:04.628+00	2026-02-19 11:55:04.628+00
2f55184d-bea4-4540-86fd-dd25f9ecee2c	Fatma Ibrahim	fatma.ibrahim@college.edu	$2b$10$5D8TG/EdQ81DedQBO1fWp.v.ztdIWtnINkghK5EJNBey5LBLIEQvq	student	\N	\N	\N	\N	2026-02-19 11:55:05.219+00	2026-02-19 11:55:05.219+00
2b6258b2-360e-4a9d-bfbb-aa6c8b073da4	Dr. Mahmoud Saleh	mahmoud.saleh@college.edu	$2b$10$UH/EAgz9V3sWSVwUrWcUjekBqev3xFP2654ZLfBhfEKD67FMDmrKi	doctor	\N	\N	\N	\N	2026-02-19 11:55:05.787+00	2026-02-19 11:55:05.787+00
53f277fa-323a-4d1c-afa7-577a7c1ac847	Eng. Noha Ahmed	noha.ahmed@college.edu	$2b$10$WZvs4e82tJzJ6NiOeZ7/6e95ATSeucBlwltzDULfEynOCUs0DNiR.	teaching_assistant	\N	\N	\N	\N	2026-02-19 11:55:06.216+00	2026-02-19 11:55:06.216+00
4a5c326d-ba47-4561-9c0d-3416812a3391	Mona Farid	mona.farid@college.edu	$2b$10$vOuVbNu/EJ.8qLPsjOGjaeFJSPx/ha.oXOoSoI83Xh6cEI/tJsXzy	admin	\N	\N	\N	\N	2026-02-19 11:55:07.131+00	2026-02-19 11:55:07.131+00
8b7809f6-609e-459f-81de-dec4ac30433a	Muhammed Mahmoud	muhammed.mahmoud@example.edu	$2b$10$OriML6qEWh7Zqh//SvVbiOM.qLK2eXS85g9vhhVQh5tvzaMkEkmgG	student	https://pbnfvqohslrvyblgqzaz.supabase.co/storage/v1/object/public/avatars/8b7809f6-609e-459f-81de-dec4ac30433a/avatar_8b7809f6-609e-459f-81de-dec4ac30433a_1769703371044.jpg	01125360953	30447812611119	Apeice 10	2026-01-29 15:13:34.119+00	2026-01-29 15:13:34.119+00
6eef4c08-90ec-42cd-8302-6bd133777c6e	Ahmed Hassan	ahmed.hassan@college.edu	$2b$10$m0hs8sJ56WypQPfqr23fDOvIrJUm0tevo73W5TcgwWyIDnFqsese6	student	\N	\N	\N	\N	2026-02-19 11:55:03.217+00	2026-02-19 11:55:03.217+00
49ddf91a-b089-4494-a166-8703a94cbbda	Abdelrhman Ahmed Mohamed	abdelrhman1@gmail.com	$2b$10$W2mMhjTPeBIDBwRH8BsnNePcRgVrf7DBBQQfvVWO8k7w56uSp/gBS	student	\N	\N	30201010103355	\N	2026-03-14 18:39:27.022+00	2026-03-14 18:39:27.022+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-12-08 11:38:26
20211116045059	2025-12-08 11:38:29
20211116050929	2025-12-08 11:38:31
20211116051442	2025-12-08 11:38:32
20211116212300	2025-12-08 11:38:35
20211116213355	2025-12-08 11:38:36
20211116213934	2025-12-08 11:38:38
20211116214523	2025-12-08 11:38:41
20211122062447	2025-12-08 11:38:42
20211124070109	2025-12-08 11:38:44
20211202204204	2025-12-08 11:38:46
20211202204605	2025-12-08 11:38:48
20211210212804	2025-12-08 11:38:53
20211228014915	2025-12-08 11:38:55
20220107221237	2025-12-08 11:38:57
20220228202821	2025-12-08 11:38:59
20220312004840	2025-12-08 11:39:00
20220603231003	2025-12-08 11:39:03
20220603232444	2025-12-08 11:39:05
20220615214548	2025-12-08 11:39:07
20220712093339	2025-12-08 11:39:09
20220908172859	2025-12-08 11:39:11
20220916233421	2025-12-08 11:39:13
20230119133233	2025-12-08 11:39:14
20230128025114	2025-12-08 11:39:17
20230128025212	2025-12-08 11:39:19
20230227211149	2025-12-08 11:39:20
20230228184745	2025-12-08 11:39:22
20230308225145	2025-12-08 11:39:24
20230328144023	2025-12-08 11:39:26
20231018144023	2025-12-08 11:39:28
20231204144023	2025-12-08 11:39:31
20231204144024	2025-12-08 11:39:32
20231204144025	2025-12-08 11:39:34
20240108234812	2025-12-08 11:39:36
20240109165339	2025-12-08 11:39:38
20240227174441	2025-12-08 11:39:41
20240311171622	2025-12-08 11:39:43
20240321100241	2025-12-08 11:39:47
20240401105812	2025-12-08 11:39:52
20240418121054	2025-12-08 11:39:55
20240523004032	2025-12-08 11:40:01
20240618124746	2025-12-08 11:40:03
20240801235015	2025-12-08 11:40:05
20240805133720	2025-12-08 11:40:06
20240827160934	2025-12-08 11:40:08
20240919163303	2025-12-08 11:40:11
20240919163305	2025-12-08 11:40:12
20241019105805	2025-12-08 11:40:14
20241030150047	2025-12-08 11:40:21
20241108114728	2025-12-08 11:40:23
20241121104152	2025-12-08 11:40:25
20241130184212	2025-12-08 11:40:27
20241220035512	2025-12-08 11:40:29
20241220123912	2025-12-08 11:40:31
20241224161212	2025-12-08 11:40:33
20250107150512	2025-12-08 11:40:34
20250110162412	2025-12-08 11:40:36
20250123174212	2025-12-08 11:40:38
20250128220012	2025-12-08 11:40:40
20250506224012	2025-12-08 11:40:41
20250523164012	2025-12-08 11:40:43
20250714121412	2025-12-08 11:40:45
20250905041441	2025-12-08 11:40:46
20251103001201	2025-12-08 11:40:48
20251120212548	2026-03-02 15:16:15
20251120215549	2026-03-02 15:16:15
20260218120000	2026-03-02 15:16:15
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
course-materials	course-materials	\N	2026-01-28 12:00:08.902054+00	2026-01-28 12:00:08.902054+00	t	f	\N	\N	\N	STANDARD
avatars	avatars	\N	2026-01-29 15:30:17.794089+00	2026-01-29 15:30:17.794089+00	t	f	\N	\N	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-12-08 11:38:23.64641
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-12-08 11:38:23.653699
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-12-08 11:38:23.685973
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-12-08 11:38:23.745187
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-12-08 11:38:23.751244
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-12-08 11:38:23.76693
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-12-08 11:38:23.773279
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-12-08 11:38:23.796717
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-12-08 11:38:23.806926
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-12-08 11:38:23.813223
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-12-08 11:38:23.819448
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-12-08 11:38:23.845463
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-12-08 11:38:23.851698
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-12-08 11:38:23.857777
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-12-08 11:38:23.864166
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-12-08 11:38:23.87195
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-12-08 11:38:23.878154
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-12-08 11:38:23.886945
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-12-08 11:38:23.903058
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-12-08 11:38:23.915571
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-12-08 11:38:23.921744
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-12-08 11:38:23.927974
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-12-08 11:38:24.49477
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2025-12-08 11:38:24.555143
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2025-12-08 11:38:24.561449
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2025-12-08 11:38:24.576163
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2025-12-08 11:38:24.58257
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-01-25 12:30:33.815482
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2025-12-08 11:38:23.660477
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2025-12-08 11:38:23.75878
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2025-12-08 11:38:23.780675
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2025-12-08 11:38:23.790302
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2025-12-08 11:38:23.934877
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2025-12-08 11:38:23.952643
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2025-12-08 11:38:24.431911
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2025-12-08 11:38:24.439736
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2025-12-08 11:38:24.445846
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2025-12-08 11:38:24.453242
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2025-12-08 11:38:24.461132
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2025-12-08 11:38:24.468795
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2025-12-08 11:38:24.471111
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2025-12-08 11:38:24.479013
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2025-12-08 11:38:24.484955
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2025-12-08 11:38:24.501462
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2025-12-08 11:38:24.514408
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2025-12-08 11:38:24.521038
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2025-12-08 11:38:24.53208
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2025-12-08 11:38:24.540304
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2025-12-08 11:38:24.54885
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2025-12-08 11:38:24.588421
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-02-14 11:33:44.626399
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-02-14 11:33:44.791643
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-02-14 11:33:44.793998
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-02-14 11:33:44.941158
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-02-14 11:33:44.944542
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-02-14 11:33:44.946802
56	fix-optimized-search-function	cb58526ebc23048049fd5bf2fd148d18b04a2073	2026-02-14 11:33:44.956215
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
cf926a2d-7d54-47c2-bac9-2b8b5f5da384	avatars	8b7809f6-609e-459f-81de-dec4ac30433a/avatar_8b7809f6-609e-459f-81de-dec4ac30433a_1769703371044.jpg	\N	2026-01-29 16:16:12.458896+00	2026-01-29 16:16:12.458896+00	2026-01-29 16:16:12.458896+00	{"eTag": "\\"67a4f8ee56216b288b456c7fabe703ce\\"", "size": 44085, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-01-29T16:16:13.000Z", "contentLength": 44085, "httpStatusCode": 200}	38d353e7-f26e-4710-a0ae-5b73c14a3a8a	\N	{}
4e790f8b-3986-4b90-a37c-55b066da67c9	avatars	general/user_img.jpg	\N	2026-01-30 14:58:08.981035+00	2026-01-30 14:58:08.981035+00	2026-01-30 14:58:08.981035+00	{"eTag": "\\"7204a06df53e155ab8072eb0ac2cfd18-1\\"", "size": 17531, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-01-30T14:58:09.000Z", "contentLength": 17531, "httpStatusCode": 200}	3df41330-abbc-4a03-a837-7197947c418d	\N	\N
229f71a8-14cc-42bb-9758-1a13435995f0	avatars	96fe4daa-b598-42bd-a50d-ccbdb693858c/avatar_96fe4daa-b598-42bd-a50d-ccbdb693858c_1769858132952.jpg	\N	2026-01-31 11:15:33.840263+00	2026-01-31 11:15:33.840263+00	2026-01-31 11:15:33.840263+00	{"eTag": "\\"2985935941f08eae8804f69c7635d6d3\\"", "size": 21583, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-01-31T11:15:34.000Z", "contentLength": 21583, "httpStatusCode": 200}	a621ec0d-2c18-44d1-8211-2248599d94f5	\N	{}
7c6afc9c-8cd2-41c1-94ee-26d55bfd3916	avatars	9c60d94a-99e3-44e7-86df-074833cab9e8/avatar_9c60d94a-99e3-44e7-86df-074833cab9e8_1771068805027.png	\N	2026-02-14 11:33:40.023011+00	2026-02-14 11:33:40.023011+00	2026-02-14 11:33:40.023011+00	{"eTag": "\\"5128bd205ee8b7e89488a967f0649973\\"", "size": 2549758, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-14T11:33:40.000Z", "contentLength": 2549758, "httpStatusCode": 200}	db6fce8e-45cf-45f9-a2c8-1978c23534ab	\N	{}
0b4d0f3a-cc94-4824-928c-fe8f63cc8108	course-materials	materials/c86640c2-def2-4c6f-8b60-8ac2ef55e091/1771525155103.pdf	\N	2026-02-19 18:19:17.361563+00	2026-02-19 18:19:17.361563+00	2026-02-19 18:19:17.361563+00	{"eTag": "\\"ebeb4575ee3b099d3473179faa1af87e\\"", "size": 3012396, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T18:19:18.000Z", "contentLength": 3012396, "httpStatusCode": 200}	9fd0f0f6-f520-4f0a-9c9d-288d63d47ac6	\N	{}
e499aadc-af5b-42fb-8b33-f6c8c3a1d6f1	course-materials	materials/c86640c2-def2-4c6f-8b60-8ac2ef55e091/1771525422378.pdf	\N	2026-02-19 18:23:43.928251+00	2026-02-19 18:23:43.928251+00	2026-02-19 18:23:43.928251+00	{"eTag": "\\"dea7f2f607f99bc99a4a5a728982950d\\"", "size": 737466, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T18:23:44.000Z", "contentLength": 737466, "httpStatusCode": 200}	88638678-6cc0-416f-8d79-473ba5b5ed43	\N	{}
c84b6be3-b2fc-4638-b52c-0d81318a2ed2	course-materials	materials/83b69f41-0b77-4acf-a84a-ad6518bc4e67/1771529727894.pdf	\N	2026-02-19 19:35:28.67675+00	2026-02-19 19:35:28.67675+00	2026-02-19 19:35:28.67675+00	{"eTag": "\\"bc972ad46b5657100327cb08002d8a78\\"", "size": 210195, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T19:35:29.000Z", "contentLength": 210195, "httpStatusCode": 200}	9c35fb7f-0e92-458b-8411-0fafaa091f69	\N	{}
5ea6e540-f229-4d09-b95e-25c849a97c52	course-materials	materials/83b69f41-0b77-4acf-a84a-ad6518bc4e67/1771611117149.pdf	\N	2026-02-20 18:11:59.318252+00	2026-02-20 18:11:59.318252+00	2026-02-20 18:11:59.318252+00	{"eTag": "\\"6346c9408ca4b62da41810fa6168c5e1\\"", "size": 1220998, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-02-20T18:12:00.000Z", "contentLength": 1220998, "httpStatusCode": 200}	efa32aa4-8c0f-42d3-8745-1b090c02a447	\N	{}
1a4b24b6-be28-442e-9060-eeea75e8bf32	course-materials	materials/83b69f41-0b77-4acf-a84a-ad6518bc4e67/1772394105040.pdf	\N	2026-03-01 19:41:47.056659+00	2026-03-01 19:41:47.056659+00	2026-03-01 19:41:47.056659+00	{"eTag": "\\"37f4aabb771706c2bb087dd5352f0651\\"", "size": 737098, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-01T19:41:47.000Z", "contentLength": 737098, "httpStatusCode": 200}	88287750-ae43-4e08-8706-5b094260c7de	\N	{}
1a2a0b64-aa10-4a9b-9f9e-0c10a36bff3c	avatars	general/images.jpg	\N	2026-03-03 19:28:46.991808+00	2026-03-03 19:28:46.991808+00	2026-03-03 19:28:46.991808+00	{"eTag": "\\"71491d38fd263585ae1a2146567e233e-1\\"", "size": 5968, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-03T19:28:47.000Z", "contentLength": 5968, "httpStatusCode": 200}	78b58dab-9f11-468a-b083-0de78f1c613a	\N	\N
056f8960-293f-4d85-a155-e2098873be5b	course-materials	materials/c86640c2-def2-4c6f-8b60-8ac2ef55e091/1772652264680.pdf	\N	2026-03-04 19:24:26.496389+00	2026-03-04 19:24:26.496389+00	2026-03-04 19:24:26.496389+00	{"eTag": "\\"cc492de89cc0ea54b642aa5ab103562f\\"", "size": 1365984, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-03-04T19:24:27.000Z", "contentLength": 1365984, "httpStatusCode": 200}	a813f0a9-ae59-44fa-bc0f-10423b94f293	\N	{}
77a1baa9-a6d2-4f5d-b561-dd29def925bb	avatars	c86640c2-def2-4c6f-8b60-8ac2ef55e091/avatar_c86640c2-def2-4c6f-8b60-8ac2ef55e091_1773638213690.jpg	\N	2026-03-16 05:16:55.52995+00	2026-03-16 05:16:55.52995+00	2026-03-16 05:16:55.52995+00	{"eTag": "\\"51826a3badc7c8f0043c9ff6bd9ac25e\\"", "size": 46071, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-16T05:16:56.000Z", "contentLength": 46071, "httpStatusCode": 200}	8531404f-2561-4318-ac5f-0d8e001516dd	\N	{}
6778bb59-aa45-4b0a-b0e8-fcdb2cefa143	avatars	c86640c2-def2-4c6f-8b60-8ac2ef55e091/avatar_c86640c2-def2-4c6f-8b60-8ac2ef55e091_1773638395052.jpg	\N	2026-03-16 05:19:56.772271+00	2026-03-16 05:19:56.772271+00	2026-03-16 05:19:56.772271+00	{"eTag": "\\"51826a3badc7c8f0043c9ff6bd9ac25e\\"", "size": 46071, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-16T05:19:57.000Z", "contentLength": 46071, "httpStatusCode": 200}	10b6ee36-9045-4596-9c69-5ddbec469793	\N	{}
6c42a277-03ea-48e1-a1c7-ab7a9f1e65f0	avatars	f9338e22-6221-4c2b-bd47-3c423359fd87/avatar_f9338e22-6221-4c2b-bd47-3c423359fd87_1773642063186	\N	2026-03-16 06:21:04.379419+00	2026-03-16 06:21:04.379419+00	2026-03-16 06:21:04.379419+00	{"eTag": "\\"605fa6b8f6ffce3fa94f9e8343791e63\\"", "size": 56592, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2026-03-16T06:21:05.000Z", "contentLength": 56592, "httpStatusCode": 200}	091b7632-f76c-4c75-b2ea-081adbf8cec1	\N	{}
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: academic_calendar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.academic_calendar_id_seq', 4, true);


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announcements_id_seq', 8, true);


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 47, true);


--
-- Name: community_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.community_groups_id_seq', 4, true);


--
-- Name: community_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.community_posts_id_seq', 23, true);


--
-- Name: course_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_materials_id_seq', 22, true);


--
-- Name: course_offerings_offering_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_offerings_offering_id_seq', 11, true);


--
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 41, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 8, true);


--
-- Name: exams_exam_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exams_exam_id_seq', 6, true);


--
-- Name: financials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.financials_id_seq', 1, false);


--
-- Name: grade_distributions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grade_distributions_id_seq', 1, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 1, false);


--
-- Name: lectures_lecture_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lectures_lecture_id_seq', 13, true);


--
-- Name: news_articles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.news_articles_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 418, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: post_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_comments_id_seq', 18, true);


--
-- Name: task_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_submissions_id_seq', 6, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 7, true);


--
-- Name: testimonials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.testimonials_id_seq', 1, false);


--
-- Name: tutorials_labs_tutorial_lab_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tutorials_labs_tutorial_lab_id_seq', 11, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: academic_calendar academic_calendar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_calendar
    ADD CONSTRAINT academic_calendar_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: community_groups community_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_groups
    ADD CONSTRAINT community_groups_pkey PRIMARY KEY (id);


--
-- Name: community_posts community_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_posts
    ADD CONSTRAINT community_posts_pkey PRIMARY KEY (id);


--
-- Name: course_materials course_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT course_materials_pkey PRIMARY KEY (id);


--
-- Name: course_offerings course_offerings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_offerings
    ADD CONSTRAINT course_offerings_pkey PRIMARY KEY (offering_id);


--
-- Name: course_prerequisites course_prerequisites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_prerequisites
    ADD CONSTRAINT course_prerequisites_pkey PRIMARY KEY (course_code, prerequisite_code);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_student_user_id_lecture_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_user_id_lecture_id_key UNIQUE (student_user_id, lecture_id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (exam_id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (file_id);


--
-- Name: financials financials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financials
    ADD CONSTRAINT financials_pkey PRIMARY KEY (id);


--
-- Name: grade_distributions grade_distributions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_distributions
    ADD CONSTRAINT grade_distributions_pkey PRIMARY KEY (id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (group_id, user_id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: lectures lectures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lectures
    ADD CONSTRAINT lectures_pkey PRIMARY KEY (lecture_id);


--
-- Name: news_articles news_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_articles
    ADD CONSTRAINT news_articles_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (post_id, user_id);


--
-- Name: student_profiles student_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: task_submissions task_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT task_submissions_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: tutorials_labs tutorials_labs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutorials_labs
    ADD CONSTRAINT tutorials_labs_pkey PRIMARY KEY (tutorial_lab_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: academic_calendar_event_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX academic_calendar_event_date_idx ON public.academic_calendar USING btree (event_date);


--
-- Name: academic_calendar_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX academic_calendar_event_type_idx ON public.academic_calendar USING btree (event_type);


--
-- Name: academic_calendar_semester_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX academic_calendar_semester_idx ON public.academic_calendar USING btree (semester);


--
-- Name: community_posts_author_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX community_posts_author_id_idx ON public.community_posts USING btree (author_id);


--
-- Name: community_posts_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX community_posts_created_at_idx ON public.community_posts USING btree (created_at);


--
-- Name: community_posts_group_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX community_posts_group_id_idx ON public.community_posts USING btree (group_id);


--
-- Name: departments_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX departments_name_key ON public.departments USING btree (name);


--
-- Name: events_event_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_event_date_idx ON public.events USING btree (event_date);


--
-- Name: files_file_path_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX files_file_path_key ON public.files USING btree (file_path);


--
-- Name: financials_department_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX financials_department_id_key ON public.financials USING btree (department_id);


--
-- Name: grade_distributions_lecture_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX grade_distributions_lecture_id_key ON public.grade_distributions USING btree (lecture_id);


--
-- Name: group_members_group_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX group_members_group_id_idx ON public.group_members USING btree (group_id);


--
-- Name: group_members_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX group_members_user_id_idx ON public.group_members USING btree (user_id);


--
-- Name: invoices_semester_year_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoices_semester_year_idx ON public.invoices USING btree (semester, year);


--
-- Name: invoices_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoices_status_idx ON public.invoices USING btree (status);


--
-- Name: invoices_stripe_session_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX invoices_stripe_session_id_key ON public.invoices USING btree (stripe_session_id);


--
-- Name: invoices_student_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoices_student_user_id_idx ON public.invoices USING btree (student_user_id);


--
-- Name: notifications_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at);


--
-- Name: notifications_is_read_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_is_read_idx ON public.notifications USING btree (is_read);


--
-- Name: notifications_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);


--
-- Name: payments_gateway_transaction_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payments_gateway_transaction_id_key ON public.payments USING btree (gateway, transaction_id);


--
-- Name: payments_invoice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_invoice_id_idx ON public.payments USING btree (invoice_id);


--
-- Name: payments_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_status_idx ON public.payments USING btree (status);


--
-- Name: post_comments_author_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX post_comments_author_id_idx ON public.post_comments USING btree (author_id);


--
-- Name: post_comments_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX post_comments_created_at_idx ON public.post_comments USING btree (created_at);


--
-- Name: post_comments_post_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX post_comments_post_id_idx ON public.post_comments USING btree (post_id);


--
-- Name: post_likes_post_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX post_likes_post_id_idx ON public.post_likes USING btree (post_id);


--
-- Name: post_likes_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX post_likes_user_id_idx ON public.post_likes USING btree (user_id);


--
-- Name: student_profiles_department_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX student_profiles_department_id_idx ON public.student_profiles USING btree (department_id);


--
-- Name: student_profiles_faculty_advisor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX student_profiles_faculty_advisor_id_idx ON public.student_profiles USING btree (faculty_advisor_id);


--
-- Name: student_profiles_student_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX student_profiles_student_id_idx ON public.student_profiles USING btree (student_id);


--
-- Name: student_profiles_student_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX student_profiles_student_id_key ON public.student_profiles USING btree (student_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: academic_calendar academic_calendar_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_calendar
    ADD CONSTRAINT academic_calendar_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: announcements announcements_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: attendance attendance_lecture_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_lecture_id_fkey FOREIGN KEY (lecture_id) REFERENCES public.lectures(lecture_id);


--
-- Name: attendance attendance_student_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES public.users(id);


--
-- Name: attendance attendance_tutorial_lab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_tutorial_lab_id_fkey FOREIGN KEY (tutorial_lab_id) REFERENCES public.tutorials_labs(tutorial_lab_id);


--
-- Name: community_posts community_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_posts
    ADD CONSTRAINT community_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: community_posts community_posts_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_posts
    ADD CONSTRAINT community_posts_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.community_groups(id) ON DELETE SET NULL;


--
-- Name: course_materials course_materials_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT course_materials_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(file_id);


--
-- Name: course_materials course_materials_lecture_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT course_materials_lecture_id_fkey FOREIGN KEY (lecture_id) REFERENCES public.lectures(lecture_id);


--
-- Name: course_materials course_materials_tutorial_lab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT course_materials_tutorial_lab_id_fkey FOREIGN KEY (tutorial_lab_id) REFERENCES public.tutorials_labs(tutorial_lab_id);


--
-- Name: course_offerings course_offerings_course_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_offerings
    ADD CONSTRAINT course_offerings_course_code_fkey FOREIGN KEY (course_code) REFERENCES public.courses(code);


--
-- Name: course_prerequisites course_prerequisites_course_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_prerequisites
    ADD CONSTRAINT course_prerequisites_course_code_fkey FOREIGN KEY (course_code) REFERENCES public.courses(code);


--
-- Name: course_prerequisites course_prerequisites_prerequisite_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_prerequisites
    ADD CONSTRAINT course_prerequisites_prerequisite_code_fkey FOREIGN KEY (prerequisite_code) REFERENCES public.courses(code);


--
-- Name: courses courses_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- Name: enrollments enrollments_lecture_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_lecture_id_fkey FOREIGN KEY (lecture_id) REFERENCES public.lectures(lecture_id);


--
-- Name: enrollments enrollments_student_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES public.users(id);


--
-- Name: enrollments enrollments_tutorial_lab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_tutorial_lab_id_fkey FOREIGN KEY (tutorial_lab_id) REFERENCES public.tutorials_labs(tutorial_lab_id);


--
-- Name: exams exams_offering_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_offering_id_fkey FOREIGN KEY (offering_id) REFERENCES public.course_offerings(offering_id);


--
-- Name: files files_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id);


--
-- Name: financials financials_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financials
    ADD CONSTRAINT financials_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- Name: grade_distributions grade_distributions_lecture_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_distributions
    ADD CONSTRAINT grade_distributions_lecture_id_fkey FOREIGN KEY (lecture_id) REFERENCES public.lectures(lecture_id) ON DELETE CASCADE;


--
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.community_groups(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_student_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lectures lectures_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lectures
    ADD CONSTRAINT lectures_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id);


--
-- Name: lectures lectures_offering_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lectures
    ADD CONSTRAINT lectures_offering_id_fkey FOREIGN KEY (offering_id) REFERENCES public.course_offerings(offering_id) ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: student_profiles student_profiles_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- Name: student_profiles student_profiles_faculty_advisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_faculty_advisor_id_fkey FOREIGN KEY (faculty_advisor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: student_profiles student_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: task_submissions task_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT task_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: task_submissions task_submissions_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT task_submissions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_lecture_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_lecture_id_fkey FOREIGN KEY (lecture_id) REFERENCES public.lectures(lecture_id);


--
-- Name: tasks tasks_tutorial_lab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_tutorial_lab_id_fkey FOREIGN KEY (tutorial_lab_id) REFERENCES public.tutorials_labs(tutorial_lab_id);


--
-- Name: tutorials_labs tutorials_labs_offering_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutorials_labs
    ADD CONSTRAINT tutorials_labs_offering_id_fkey FOREIGN KEY (offering_id) REFERENCES public.course_offerings(offering_id) ON DELETE CASCADE;


--
-- Name: tutorials_labs tutorials_labs_ta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutorials_labs
    ADD CONSTRAINT tutorials_labs_ta_id_fkey FOREIGN KEY (ta_id) REFERENCES public.users(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Allow all for service role; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow all for service role" ON storage.objects USING (true) WITH CHECK (true);


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE _prisma_migrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._prisma_migrations TO anon;
GRANT ALL ON TABLE public._prisma_migrations TO authenticated;
GRANT ALL ON TABLE public._prisma_migrations TO service_role;


--
-- Name: TABLE academic_calendar; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.academic_calendar TO anon;
GRANT ALL ON TABLE public.academic_calendar TO authenticated;
GRANT ALL ON TABLE public.academic_calendar TO service_role;


--
-- Name: SEQUENCE academic_calendar_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.academic_calendar_id_seq TO anon;
GRANT ALL ON SEQUENCE public.academic_calendar_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.academic_calendar_id_seq TO service_role;


--
-- Name: TABLE announcements; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.announcements TO anon;
GRANT ALL ON TABLE public.announcements TO authenticated;
GRANT ALL ON TABLE public.announcements TO service_role;


--
-- Name: SEQUENCE announcements_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.announcements_id_seq TO anon;
GRANT ALL ON SEQUENCE public.announcements_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.announcements_id_seq TO service_role;


--
-- Name: TABLE attendance; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.attendance TO anon;
GRANT ALL ON TABLE public.attendance TO authenticated;
GRANT ALL ON TABLE public.attendance TO service_role;


--
-- Name: SEQUENCE attendance_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.attendance_id_seq TO anon;
GRANT ALL ON SEQUENCE public.attendance_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.attendance_id_seq TO service_role;


--
-- Name: TABLE community_groups; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.community_groups TO anon;
GRANT ALL ON TABLE public.community_groups TO authenticated;
GRANT ALL ON TABLE public.community_groups TO service_role;


--
-- Name: SEQUENCE community_groups_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.community_groups_id_seq TO anon;
GRANT ALL ON SEQUENCE public.community_groups_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.community_groups_id_seq TO service_role;


--
-- Name: TABLE community_posts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.community_posts TO anon;
GRANT ALL ON TABLE public.community_posts TO authenticated;
GRANT ALL ON TABLE public.community_posts TO service_role;


--
-- Name: SEQUENCE community_posts_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.community_posts_id_seq TO anon;
GRANT ALL ON SEQUENCE public.community_posts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.community_posts_id_seq TO service_role;


--
-- Name: TABLE course_materials; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.course_materials TO anon;
GRANT ALL ON TABLE public.course_materials TO authenticated;
GRANT ALL ON TABLE public.course_materials TO service_role;


--
-- Name: SEQUENCE course_materials_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.course_materials_id_seq TO anon;
GRANT ALL ON SEQUENCE public.course_materials_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.course_materials_id_seq TO service_role;


--
-- Name: TABLE course_offerings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.course_offerings TO anon;
GRANT ALL ON TABLE public.course_offerings TO authenticated;
GRANT ALL ON TABLE public.course_offerings TO service_role;


--
-- Name: SEQUENCE course_offerings_offering_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.course_offerings_offering_id_seq TO anon;
GRANT ALL ON SEQUENCE public.course_offerings_offering_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.course_offerings_offering_id_seq TO service_role;


--
-- Name: TABLE course_prerequisites; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.course_prerequisites TO anon;
GRANT ALL ON TABLE public.course_prerequisites TO authenticated;
GRANT ALL ON TABLE public.course_prerequisites TO service_role;


--
-- Name: TABLE courses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.courses TO anon;
GRANT ALL ON TABLE public.courses TO authenticated;
GRANT ALL ON TABLE public.courses TO service_role;


--
-- Name: TABLE departments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.departments TO anon;
GRANT ALL ON TABLE public.departments TO authenticated;
GRANT ALL ON TABLE public.departments TO service_role;


--
-- Name: TABLE enrollments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.enrollments TO anon;
GRANT ALL ON TABLE public.enrollments TO authenticated;
GRANT ALL ON TABLE public.enrollments TO service_role;


--
-- Name: SEQUENCE enrollments_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.enrollments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.enrollments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.enrollments_id_seq TO service_role;


--
-- Name: TABLE events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.events TO anon;
GRANT ALL ON TABLE public.events TO authenticated;
GRANT ALL ON TABLE public.events TO service_role;


--
-- Name: SEQUENCE events_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.events_id_seq TO anon;
GRANT ALL ON SEQUENCE public.events_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.events_id_seq TO service_role;


--
-- Name: TABLE exams; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.exams TO anon;
GRANT ALL ON TABLE public.exams TO authenticated;
GRANT ALL ON TABLE public.exams TO service_role;


--
-- Name: SEQUENCE exams_exam_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.exams_exam_id_seq TO anon;
GRANT ALL ON SEQUENCE public.exams_exam_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.exams_exam_id_seq TO service_role;


--
-- Name: TABLE files; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.files TO anon;
GRANT ALL ON TABLE public.files TO authenticated;
GRANT ALL ON TABLE public.files TO service_role;


--
-- Name: TABLE financials; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.financials TO anon;
GRANT ALL ON TABLE public.financials TO authenticated;
GRANT ALL ON TABLE public.financials TO service_role;


--
-- Name: SEQUENCE financials_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.financials_id_seq TO anon;
GRANT ALL ON SEQUENCE public.financials_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.financials_id_seq TO service_role;


--
-- Name: TABLE grade_distributions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.grade_distributions TO anon;
GRANT ALL ON TABLE public.grade_distributions TO authenticated;
GRANT ALL ON TABLE public.grade_distributions TO service_role;


--
-- Name: SEQUENCE grade_distributions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.grade_distributions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.grade_distributions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.grade_distributions_id_seq TO service_role;


--
-- Name: TABLE group_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.group_members TO anon;
GRANT ALL ON TABLE public.group_members TO authenticated;
GRANT ALL ON TABLE public.group_members TO service_role;


--
-- Name: TABLE invoices; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.invoices TO anon;
GRANT ALL ON TABLE public.invoices TO authenticated;
GRANT ALL ON TABLE public.invoices TO service_role;


--
-- Name: SEQUENCE invoices_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.invoices_id_seq TO anon;
GRANT ALL ON SEQUENCE public.invoices_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.invoices_id_seq TO service_role;


--
-- Name: TABLE lectures; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lectures TO anon;
GRANT ALL ON TABLE public.lectures TO authenticated;
GRANT ALL ON TABLE public.lectures TO service_role;


--
-- Name: SEQUENCE lectures_lecture_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.lectures_lecture_id_seq TO anon;
GRANT ALL ON SEQUENCE public.lectures_lecture_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.lectures_lecture_id_seq TO service_role;


--
-- Name: TABLE news_articles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.news_articles TO anon;
GRANT ALL ON TABLE public.news_articles TO authenticated;
GRANT ALL ON TABLE public.news_articles TO service_role;


--
-- Name: SEQUENCE news_articles_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.news_articles_id_seq TO anon;
GRANT ALL ON SEQUENCE public.news_articles_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.news_articles_id_seq TO service_role;


--
-- Name: TABLE notification_preferences; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_preferences TO anon;
GRANT ALL ON TABLE public.notification_preferences TO authenticated;
GRANT ALL ON TABLE public.notification_preferences TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- Name: SEQUENCE notifications_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.notifications_id_seq TO anon;
GRANT ALL ON SEQUENCE public.notifications_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.notifications_id_seq TO service_role;


--
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payments TO anon;
GRANT ALL ON TABLE public.payments TO authenticated;
GRANT ALL ON TABLE public.payments TO service_role;


--
-- Name: SEQUENCE payments_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.payments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.payments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.payments_id_seq TO service_role;


--
-- Name: TABLE post_comments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.post_comments TO anon;
GRANT ALL ON TABLE public.post_comments TO authenticated;
GRANT ALL ON TABLE public.post_comments TO service_role;


--
-- Name: SEQUENCE post_comments_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.post_comments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.post_comments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.post_comments_id_seq TO service_role;


--
-- Name: TABLE post_likes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.post_likes TO anon;
GRANT ALL ON TABLE public.post_likes TO authenticated;
GRANT ALL ON TABLE public.post_likes TO service_role;


--
-- Name: TABLE student_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_profiles TO anon;
GRANT ALL ON TABLE public.student_profiles TO authenticated;
GRANT ALL ON TABLE public.student_profiles TO service_role;


--
-- Name: TABLE task_submissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.task_submissions TO anon;
GRANT ALL ON TABLE public.task_submissions TO authenticated;
GRANT ALL ON TABLE public.task_submissions TO service_role;


--
-- Name: SEQUENCE task_submissions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.task_submissions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.task_submissions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.task_submissions_id_seq TO service_role;


--
-- Name: TABLE tasks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tasks TO anon;
GRANT ALL ON TABLE public.tasks TO authenticated;
GRANT ALL ON TABLE public.tasks TO service_role;


--
-- Name: SEQUENCE tasks_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tasks_id_seq TO anon;
GRANT ALL ON SEQUENCE public.tasks_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.tasks_id_seq TO service_role;


--
-- Name: TABLE testimonials; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.testimonials TO anon;
GRANT ALL ON TABLE public.testimonials TO authenticated;
GRANT ALL ON TABLE public.testimonials TO service_role;


--
-- Name: SEQUENCE testimonials_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.testimonials_id_seq TO anon;
GRANT ALL ON SEQUENCE public.testimonials_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.testimonials_id_seq TO service_role;


--
-- Name: TABLE tutorials_labs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tutorials_labs TO anon;
GRANT ALL ON TABLE public.tutorials_labs TO authenticated;
GRANT ALL ON TABLE public.tutorials_labs TO service_role;


--
-- Name: SEQUENCE tutorials_labs_tutorial_lab_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tutorials_labs_tutorial_lab_id_seq TO anon;
GRANT ALL ON SEQUENCE public.tutorials_labs_tutorial_lab_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.tutorials_labs_tutorial_lab_id_seq TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict fqDS8HdSE6TR0EmCDfhI4x4F30Z7Gb8ro8UdNUagSog85Pgi89evhgn5ee5DgaL

